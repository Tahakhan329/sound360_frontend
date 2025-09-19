from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import io, os, base64, logging
import torch, torchaudio
import noisereduce as nr


logger = logging.getLogger("uvicorn.error")


class UserVoiceRegistration(BaseModel):
    b64_voice_sample: str

class UserVoiceProcessing:
    def __init__(self, username: str, request_data: dict):
        self.username: str = username
        self.sample_voice_b64: str = request_data.get("b64_voice_sample")

        try:
            self.audio_tensor, self.sample_rate = self._decode_b64_audio(self.sample_voice_b64)
        except Exception as e:
            logger.error(f"Error decoding base64 audio for {self.username}: {e}")
            raise HTTPException(status_code=400, detail="Invalid audio data")

    def _decode_b64_audio(self, b64_audio: str):
        """Decode base64 audio and return waveform + sample_rate"""
        if not b64_audio:
            raise ValueError("No voice sample provided (b64_voice_sample missing).")

        try:
            audio_bytes = base64.b64decode(b64_audio)
            buffer = io.BytesIO(audio_bytes)
            waveform, sample_rate = torchaudio.load(buffer)
            return waveform, sample_rate
        except Exception:
            logger.exception("Failed to decode or load audio")
            raise

    def save_audio(self, target_sr: Optional[int] = None, denoise: bool = True):
        """Save audio to disk (optionally resample and denoise)."""
        try:
            os.makedirs("agents_audios", exist_ok=True)
            audio_store_path = os.path.join("agents_audios", f"{self.username}_voice.wav")

            if os.path.exists(audio_store_path):
                raise HTTPException(
                    status_code=409,
                    detail=f"Voice sample for {self.username} already exists.",
                )

            waveform = self.audio_tensor
            sample_rate = self.sample_rate

            if target_sr and sample_rate != target_sr:
                waveform = torchaudio.functional.resample(
                    waveform, orig_freq=sample_rate, new_freq=target_sr
                )
                sample_rate = target_sr

            if denoise:
                waveform_np = waveform.squeeze().cpu().numpy()
                reduced_noise_audio = nr.reduce_noise(y=waveform_np, sr=sample_rate)
                waveform = torch.tensor(reduced_noise_audio).float()

            if waveform.ndim == 1:
                waveform = waveform.unsqueeze(0)
            elif waveform.ndim > 2:
                waveform = waveform.squeeze(0)

            torchaudio.save(audio_store_path, waveform, sample_rate)
            return audio_store_path

        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to save audio")
            raise HTTPException(status_code=500, detail=f"Could not save audio file: {str(e)}")


