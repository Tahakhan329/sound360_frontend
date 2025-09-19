import os
import io
import shutil
import base64
import logging
import warnings
import asyncio
import time
from collections import deque
from typing import Dict, Any, Optional

from fastapi import HTTPException

import numpy as np
import librosa

from difflib import SequenceMatcher

import torch
import torchaudio
import torch.nn.functional as F

from config import HF_TOKEN
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    pipeline,
    AutoModelForAudioClassification,
    AutoFeatureExtractor,
)

from whisper_manager import WhisperManager

from silero_vad import load_silero_vad, get_speech_timestamps
import noisereduce as nr
from TTS.api import TTS
from nltk.tokenize import sent_tokenize
import json

from pyannote.audio import Pipeline, Model, Inference
from pyannote.core import Segment
from pydub import AudioSegment
from deepmultilingualpunctuation import PunctuationModel

from flow_graph import Agent

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("sound360.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


if torch.cuda.is_available():
    torch.cuda.empty_cache()
    try:
        torch.cuda.ipc_collect()
    except Exception:
        pass


with open("llm_config.json", "r") as file:
    llm_config_json = json.load(file)

WHISPER_MODEL_SIZE = "tiny"  # change to "large" for production 
LLM_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
TTS_MODEL_ID = "tts_models/multilingual/multi-dataset/xtts_v2"
VOICE_TO_CLONE = os.path.join("samples", "audio_sample.wav")
LLM_SYS_PROMPT = llm_config_json[0]

DIARIZATION_MODEL = "pyannote/speaker-diarization"
AUDIO_EMBEDDING_MODEL = "pyannote/embedding"

TEXT_SENTIMENT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
AUDIO_SENTIMENT_MODEL = "superb/wav2vec2-base-superb-er"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Global Whisper loading (load once)
whisper_model = WhisperManager.get_model(WHISPER_MODEL_SIZE, DEVICE)

SILENCE_GRACE_MS = 300
ENABLE_BARGE_IN = True  # cancel agent output if user starts talking
TARGET_SR = 16000  # target sample rate for Whisper & VAD

agentic_ai = Agent()

def safe_pick_device(model_class, model_name: str, *args, **kwargs):
    """
    Try GPUs one by one. Fall back to CPU.
    Always pass a torch.device to .to(...).
    """
    n_gpus = torch.cuda.device_count()

    for gpu_id in range(n_gpus):
        device = torch.device(f"cuda:{gpu_id}")
        try:
            logging.info(f"Trying to load {model_name} on {device} ...")
            model = model_class(*args, **kwargs)

            if hasattr(model, "to"):
                try:
                    model = model.to(device)                 
                except TypeError:
                    model = model.to(str(device))            

            logging.info(f"Loaded {model_name} on {device}")
            return model, device
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                logging.warning(f"OOM on {device}")
                continue
            raise

    logging.info(f"All GPUs failed. Loading {model_name} on CPU.")
    device = torch.device("cpu")
    model = model_class(*args, **kwargs)
    if hasattr(model, "to"):
        try:
            model = model.to(device)
        except TypeError:
            model = model.to("cpu")
    return model, device

def _now_ms() -> float:
    return time.monotonic() * 1000.0


async def _cancel_task(task: asyncio.Task):
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


def find_fuzzy_overlap_suffix_prefix(a: str, b: str, threshold=0.7) -> int:
    max_len = min(len(a), len(b))
    for length in range(max_len, 0, -1):
        suffix = a[-length:]
        prefix = b[:length]
        ratio = SequenceMatcher(None, suffix.lower(), prefix.lower()).ratio()
        if ratio >= threshold:
            return length
    return 0


def pcm16_base64_from_float(audio_f32: np.ndarray, sr: int = 24000) -> str:
    pcm16 = np.clip(audio_f32, -1.0, 1.0)
    pcm16 = (pcm16 * 32767.0).astype(np.int16)
    return base64.b64encode(pcm16.tobytes()).decode("utf-8")


class VoiceProcessor:
    _bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    _llm_tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_ID, use_fast=True)
    max_memory = {
        0: "4GiB",  
        "cpu": "16GiB" 
        }

    _llm_model = AutoModelForCausalLM.from_pretrained(
        LLM_MODEL_ID,
        quantization_config=_bnb_config,
        device_map="auto",
        max_memory=max_memory,
        torch_dtype=torch.bfloat16,
        low_cpu_mem_usage=True,
        offload_state_dict=True,
        trust_remote_code=True,
    )
    _llm_pipeline = pipeline(
        "text-generation",
        model=_llm_model,
        tokenizer=_llm_tokenizer,
        return_full_text=True,
        max_new_tokens=128,
        do_sample=True,
        temperature=0.1,
        top_p=0.95,
        repetition_penalty=1.05,
    )

    _tts_model, tts_device = safe_pick_device(TTS, "TTS", TTS_MODEL_ID)

    _vad_model = load_silero_vad()

    def __init__(
        self,
        send_message=None,
        llm_sys_prompt: dict = LLM_SYS_PROMPT,
        voice_to_clone: str = VOICE_TO_CLONE,
    ):
        self.llm_pipeline = VoiceProcessor._llm_pipeline
        self.llm_tokenizer = VoiceProcessor._llm_tokenizer
        self.tts_model = VoiceProcessor._tts_model
        self.vad_model = VoiceProcessor._vad_model

        self.voice_to_clone = voice_to_clone
        self.llm_sys_prompt = llm_sys_prompt
        self.session_memory: Dict[str, Dict[str, Any]] = {}
        self.send_message = send_message

        logger.info("VoiceProcessor initialized with shared models.")

    def clear_session_memory(self, session_id: str):
        if session_id in self.session_memory:
            sm = self.session_memory[session_id]
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(_cancel_task(sm.get("tts_task")))
                loop.create_task(_cancel_task(sm.get("llm_task")))
            except RuntimeError:
                pass
            del self.session_memory[session_id]
            logger.info("Cleared session memory for %s", session_id)

    async def _send_transcription(self, session_id, text: str):
        if self.send_message:
            await self.send_message(
                {"type": "transcription", "data": {"text": text}}, session_id
            )

    async def _send_llm_response(self, session_id, data: Dict[str, Any]):
        if self.send_message:
            await self.send_message(
                {"type": "voice", "data": {"llm_processing": data}}, session_id
            )

    async def _barge_in_if_needed(self, sm: Dict[str, Any]):
        """If agent is speaking and user speaks, cancel agent output immediately."""
        if not ENABLE_BARGE_IN:
            return
        if sm["state"] == "SPEAKING":
            logger.info("User interrupted the agent — performing barge-in cancellation.")
            await _cancel_task(sm.get("tts_task"))
            await _cancel_task(sm.get("llm_task"))
            sm["tts_task"] = None
            sm["llm_task"] = None
            sm["state"] = "LISTENING"

    async def _maybe_start_llm_tts(self, session_id: str, sm: Dict[str, Any]):
        """Start LLM+TTS if conditions are met, as a cancellable task."""
        if sm["empty_chunk_count"] < 2:
            return
        if sm["state"] != "LISTENING":
            return
        if _now_ms() - sm["last_user_speech_ts"] < SILENCE_GRACE_MS:
            return
        if not sm["text_for_llm"]:
            return

        sm["state"] = "THINKING"

        async def _llm_and_tts():
            try:
                llm_response, lang = await agentic_ai.invoke(
                    sm, self.llm_tokenizer, self.llm_pipeline
                )

                wav = await asyncio.to_thread(
                    self.tts_model.tts,
                    text=llm_response,
                    speaker_wav=self.voice_to_clone,
                    language=lang,
                )

                sound_array = np.array(wav, dtype=np.float32)
                reduced_noise_audio = await asyncio.to_thread(
                    nr.reduce_noise, y=sound_array, sr=24000
                )
                audio_b64 = pcm16_base64_from_float(reduced_noise_audio, sr=24000)

                llm_data = {
                    "input_text": str(sm["text_for_llm"]),
                    "llm_response": str(llm_response),
                    "audio_b64": str(audio_b64),
                    "audio_meta": {
                        "container": "RAW_PCM",
                        "sample_rate": int(24000),
                        "channels": int(1),
                        "sample_format": "S16LE",
                    },
                }

                sm["state"] = "SPEAKING"
                await self._send_llm_response(session_id, llm_data)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.exception("Error during LLM+TTS pipeline: %s", e)
            finally:
                sm["text_for_llm"] = ""
                sm["empty_chunk_count"] = 0
                if sm["state"] != "LISTENING":
                    sm["state"] = "LISTENING"

        sm["llm_task"] = asyncio.create_task(_llm_and_tts())

    async def processing(self, arguments: dict):
        session_id = arguments.get("session_id", "")
        user_id = arguments.get("user_id", "")
        username = arguments.get("username", "")
        current_chunk_b64 = arguments.get("current_audio_chunk", "")
        sample_rate = int(arguments.get("sample_rate", 16000))
        language_preference = arguments.get("language_preference", "auto")

        if not session_id or not user_id:
            return {"status": False, "error": "Missing session_id or user_id"}

        if session_id not in self.session_memory:
            self.session_memory[session_id] = {
                "user_id": user_id,
                "username": username,
                "chunks": deque(maxlen=3),
                "text_for_llm": "",
                "emitted_transcriptions": deque(maxlen=3),
                "last_emitted_text": "",
                "count_emits_transcription": 0,
                "recent_sentences": set(),
                "empty_chunk_count": 0,
                "state": "LISTENING",  # LISTENING OR THINKING OR SPEAKING
                "last_user_speech_ts": 0.0,  # ms
                "tts_task": None,
                "llm_task": None,
                "chat_history": [self.llm_sys_prompt],
            }

        sm = self.session_memory[session_id]

        if not str(current_chunk_b64).strip():
            sm["empty_chunk_count"] += 1
            await self._maybe_start_llm_tts(session_id, sm)
            return {"status": True, "note": "Empty chunk processed."}

        try:
            chunk_bytes = base64.b64decode(current_chunk_b64)
            audio_np = (
                np.frombuffer(chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            )
        except Exception as e:
            logger.error(f"Failed to decode PCM audio chunk: {e}")
            return {"status": False, "error": "Failed to decode audio chunk"}

        if audio_np.size == 0:
            logger.error("Empty or invalid audio_np, skipping transcription")
            return {"status": False, "error": "Empty audio data"}
        

        try:
            reduced_noise_audio = await asyncio.to_thread(
                nr.reduce_noise, y=audio_np, sr=sample_rate
            )
        except Exception as e:
            logger.warning(f"Noise reduction failed, using raw audio. Err={e}")
            reduced_noise_audio = audio_np

        if sample_rate != TARGET_SR:
            try:
                audio_16k = await asyncio.to_thread(
                    librosa.resample, reduced_noise_audio, sample_rate, TARGET_SR
                )
                
                if np.mean(np.abs(audio_16k)) < 1e-3:  
                    return {"status": False, "note": "No speech detected Empty chunk"}

            except Exception as e:
                logger.warning(
                    f"Resample to 16k failed, proceeding with original SR. Err={e}"
                )
                audio_16k = reduced_noise_audio
        else:
            audio_16k = reduced_noise_audio

        try:
            audio_tensor = torch.from_numpy(audio_16k)
            speech_timestamps = get_speech_timestamps(
                audio_tensor,
                self.vad_model,
                sampling_rate=TARGET_SR,
                return_seconds=False,
                threshold=0.85
            )
        except Exception as e:
            logger.error(f"VAD failed: {e}")
            speech_timestamps = []

        if len(speech_timestamps) > 0:
            sm["last_user_speech_ts"] = _now_ms()
            await self._barge_in_if_needed(sm)
            sm["empty_chunk_count"] = 0

            # normalized_audio = librosa.util.normalize(audio_16k)
            if np.max(np.abs(audio_16k)) > 1e-4:  # Only normalize if there's actual signal
                normalized_audio = librosa.util.normalize(audio_16k)
            else:
                normalized_audio = audio_16k
            normalized_audio = np.clip(normalized_audio, -1.0, 1.0)
            sm["chunks"].append(normalized_audio)
            concat_audio = np.concatenate(list(sm["chunks"]))
        else:
            sm["empty_chunk_count"] += 1
            await self._maybe_start_llm_tts(session_id, sm)
            return {"status": False, "note": "No speech detected"}

        try:
            concat_audio_f32 = concat_audio.astype(np.float32)
            result = await asyncio.to_thread(
                whisper_model.transcribe,
                concat_audio_f32,
                condition_on_previous_text=False,
                no_speech_threshold=0.75,
                language=None if language_preference == "auto" else language_preference,
                temperature=0.05,
                best_of=1,
                without_timestamps=True,
            )
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return {"status": False, "error": "Transcription failed"}

        text = str(result.get("text", "")).strip()
        detected_language = str(result.get("language", "")).strip()

        if not text:
            sm["empty_chunk_count"] += 1
            await self._maybe_start_llm_tts(session_id, sm)
            return {"status": False, "note": "No text in the speech"}

        last_text = sm["last_emitted_text"]
        overlap_len = find_fuzzy_overlap_suffix_prefix(last_text, text, threshold=0.7)
        new_part = text[overlap_len:].strip()

        if new_part and detected_language in ["en", "ar"]:
            await self._send_transcription(session_id, new_part)
            sm["last_emitted_text"] = text
            sm["count_emits_transcription"] += 1
            sm["emitted_transcriptions"].append(new_part)
            sm["text_for_llm"] = " ".join([sm["text_for_llm"], new_part]).strip()

        return {"status": True, "transcription": new_part}


class SentimentAnalyzer:
    
    _diarization_pipeline, diarization_device = safe_pick_device(
        lambda: Pipeline.from_pretrained(DIARIZATION_MODEL, use_auth_token=HF_TOKEN),
        "DiarizationPipeline"
    )

    _audio_embedding_model, _audio_embedding_device = safe_pick_device(
        lambda: Model.from_pretrained(AUDIO_EMBEDDING_MODEL, use_auth_token=HF_TOKEN),
        "AudioEmbeddingModel"
    )

    _text_sentiment_model = pipeline("sentiment-analysis", model=TEXT_SENTIMENT_MODEL)
    _audio_sentiment_model = AutoModelForAudioClassification.from_pretrained(
        AUDIO_SENTIMENT_MODEL, use_auth_token=HF_TOKEN
    )
    _audio_feature_extractor = AutoFeatureExtractor.from_pretrained(AUDIO_SENTIMENT_MODEL)
    _punctuation_restore_model = PunctuationModel()

    def __init__(
        self,
        calls_base_dir: str = "calls_recording",
        agents_audios: str = "agents_audios",
        agent_id: str = None,
        call_id: str = None,
        call_recording_b64: str = None,
        user_voice_sample_path: Optional[str] = None,  
    ):
        self.diarization_pipeline = SentimentAnalyzer._diarization_pipeline
        self.audio_embedding_model = SentimentAnalyzer._audio_embedding_model
        self.audio_embedding_device = SentimentAnalyzer._audio_embedding_device
        self.text_sentiment_model = SentimentAnalyzer._text_sentiment_model
        self.audio_sentiment_model = SentimentAnalyzer._audio_sentiment_model
        self.audio_feature_extractor = SentimentAnalyzer._audio_feature_extractor
        self.punctuation_restore_model = SentimentAnalyzer._punctuation_restore_model

        self.audio_sentiment_id2label = (
            self.audio_sentiment_model.config.id2label
            if hasattr(self.audio_sentiment_model.config, "id2label")
            else {}
        )

        self.calls_base_dir = calls_base_dir
        self.agent_id = agent_id
        self.agents_audios = agents_audios
        self.call_id = call_id
        self.call_recording_b64 = call_recording_b64

        os.makedirs(calls_base_dir, exist_ok=True)
        os.makedirs(self.agents_audios, exist_ok=True)

        if user_voice_sample_path:
            self.user_voice_sample = user_voice_sample_path
        else:
            self.user_voice_sample = (
                os.path.join(self.agents_audios, f"{self.agent_id}_voice.wav")
                if self.agent_id
                else None
            )

        if not self.user_voice_sample or not os.path.exists(self.user_voice_sample):
            logger.exception("No voice file found for agent_id or provided path")
            raise HTTPException(
                status_code=404,
                detail=f"No voice file found for agent_id '{self.agent_id}' at '{self.user_voice_sample}'",
            )

        self.audio_tensor = None
        self.sample_rate = None
        if self.call_recording_b64:
            try:
                self.audio_tensor, self.sample_rate = self._decode_b64_audio(
                    self.call_recording_b64
                )
            except Exception as e:
                logger.exception("Failed to decode provided call recording: %s", e)
                raise HTTPException(status_code=400, detail="Invalid call recording data")

        logger.info("SentimentAnalyzer initialized with shared models.")

    def _decode_b64_audio(self, b64_audio: str):
        """Decode base64 audio and return waveform + sample_rate"""
        if not b64_audio:
            raise ValueError("No voice sample provided (b64_voice_sample missing).")

        try:
            audio_bytes = base64.b64decode(b64_audio)
            buffer = io.BytesIO(audio_bytes)
            waveform, sample_rate = torchaudio.load(buffer)
            return waveform, sample_rate
        except Exception as e:
            logger.exception("Failed to decode or load audio")
            raise

    def _save_audio(
        self, target_sr: Optional[int] = None, denoise: bool = True, path: str = None
    ):
        """Save audio to disk (optionally resample and denoise)."""
        try:
            os.makedirs(self.agents_audios, exist_ok=True)
            waveform = self.audio_tensor
            sample_rate = self.sample_rate

            if waveform is None or sample_rate is None:
                raise HTTPException(
                    status_code=400, detail="No audio available to save (audio_tensor missing)"
                )

            if waveform.ndim == 2 and waveform.shape[0] > 1:
                waveform = torch.mean(waveform, dim=0, keepdim=True)

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

            if waveform.ndim == 1:
                waveform = waveform.unsqueeze(0)
            elif waveform.ndim > 2:
                waveform = waveform.squeeze(0)

            torchaudio.save(path, waveform, sample_rate)
            return True

        except Exception as e:
            logger.exception("Failed to save audio")
            raise HTTPException(
                status_code=500, detail=f"Could not save audio file: {str(e)}"
            )

    def _get_embedding_from_waveform(self, wf: torch.Tensor, sr: int, inference):
        """Compute embedding for waveform tensor [1, T]."""
        if wf.shape[0] > 1:
            wf = torch.mean(wf, dim=0, keepdim=True)
        if sr != 16000:
            wf = torchaudio.functional.resample(wf, sr, 16000)
        emb = inference({"waveform": wf, "sample_rate": 16000})
        return torch.tensor(emb)

    def _cosine_similarity(self, a, b):
        return F.cosine_similarity(a, b, dim=0).item()

    def _get_text_sentiment(self, text: str):
        """Get sentiment from multilingual text model"""
        try:
            result = self.text_sentiment_model(text)[0]
            return result["label"], result["score"]
        except Exception:
            return "neutral", 0.0

    def _get_audio_sentiment(self, audio_array, sr):
        """Get emotion from audio signal"""
        if sr != 16000:
            audio_tensor = torch.tensor(audio_array).unsqueeze(0)
            audio_array = (
                torchaudio.functional.resample(audio_tensor, sr, 16000)
                .squeeze(0)
                .numpy()
            )
            sr = 16000

        inputs = self.audio_feature_extractor(
            audio_array, sampling_rate=sr, return_tensors="pt"
        )
        with torch.no_grad():
            logits = self.audio_sentiment_model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        conf, pred_id = torch.max(probs, dim=-1)
        label = (
            self.audio_sentiment_id2label[pred_id.item()]
            if pred_id.item() in self.audio_sentiment_id2label
            else "neu"
        )
        return label, conf.item()

    def _fuse_sentiment(self, text_pred, audio_pred, w_text=0.7, w_audio=0.3):
        """Fuse text + audio into final sentiment"""

        sentiment_map = {
            "ang": "negative",
            "sad": "negative",
            "hap": "positive",
            "neu": "neutral",
        }

        text_label, text_conf = text_pred
        audio_label, audio_conf = audio_pred

        audio_sentiment = sentiment_map.get(audio_label.lower(), "neutral")

        scores = {"positive": 0, "negative": 0, "neutral": 0}
        scores[text_label.lower()] += text_conf * w_text
        scores[audio_sentiment] += audio_conf * w_audio

        final_sent = max(scores, key=scores.get)
        return final_sent, scores[final_sent]

    async def analyze(self):
        call_record_dir = os.path.join(self.calls_base_dir, f"{self.agent_id}", self.call_id)
        agent_segments_path = None
        cx_segments_path = None

        try:
            if not os.path.exists(call_record_dir):
                os.makedirs(call_record_dir)
            else:
                raise HTTPException(
                    status_code=409,
                    detail=f"Call record already exists: {call_record_dir}, Try with another call_id",
                )

            if not str(self.call_recording_b64).strip():
                raise HTTPException(
                    status_code=400, detail="Empty or corrupted call recording data"
                )

            try:
                chunk_bytes = base64.b64decode(self.call_recording_b64)
                audio_np = (
                    np.frombuffer(chunk_bytes, dtype=np.int16).astype(np.float32)
                    / 32768.0
                )
            except Exception:
                raise HTTPException(
                    status_code=400, detail="Invalid or corrupted audio data"
                )

            if audio_np.size == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Audio comes as null after conversion to np.",
                )

            if self.audio_tensor is None or self.sample_rate is None:
                try:
                    self.audio_tensor, self.sample_rate = self._decode_b64_audio(
                        self.call_recording_b64
                    )
                except Exception as e:
                    logger.exception("Failed to decode call recording: %s", e)
                    raise HTTPException(status_code=400, detail="Invalid call recording data")

            call_audio_store_path = os.path.join(call_record_dir, "complete_recording.wav")
            status = self._save_audio(target_sr=self.sample_rate, denoise=True, path=call_audio_store_path)

            if status:
                call_diarization = self.diarization_pipeline(
                    call_audio_store_path, min_speakers=2, max_speakers=4
                )

                inference = Inference(
                    self.audio_embedding_model,
                    window="whole",
                    device=self.audio_embedding_device,
                )
                ref_embedding = inference(self.user_voice_sample)
                ref_embedding = torch.tensor(ref_embedding)
                reference = ref_embedding / ref_embedding.norm(p=2, dim=-1, keepdim=True)

                speakers = {}
                for turn, _, speaker in call_diarization.itertracks(yield_label=True):
                    speakers.setdefault(speaker, []).append(turn)

                audio_duration = self.audio_tensor.size(1) / self.sample_rate
                rep_segments = {
                    spk: max(segs, key=lambda s: s.end - s.start)
                    for spk, segs in speakers.items()
                }

                speaker_scores = {}
                for spk, seg in rep_segments.items():
                    start = max(0, seg.start)
                    end = min(seg.end, audio_duration)
                    if end <= start:
                        continue
                    seg_emb = inference.crop(call_audio_store_path, Segment(start, end))
                    seg_emb = torch.tensor(seg_emb)
                    seg_emb = seg_emb / seg_emb.norm(p=2, dim=-1, keepdim=True)
                    score = torch.nn.functional.cosine_similarity(reference, seg_emb, dim=-1).item()
                    speaker_scores[spk] = score

                identified_speaker = None
                if speaker_scores:
                    identified_speaker = max(speaker_scores, key=speaker_scores.get)

                audio = AudioSegment.from_file(call_audio_store_path)
                gap = AudioSegment.silent(duration=750)

                my_segments = []
                other_segments = []

                for turn, _, speaker in call_diarization.itertracks(yield_label=True):
                    seg = audio[int(turn.start * 1000) : int(turn.end * 1000)]
                    if speaker == identified_speaker:
                        my_segments.append(seg + gap)
                    else:
                        other_segments.append(seg + gap)

                if my_segments:
                    my_voice = sum(my_segments)
                    agent_segments_path = os.path.join(call_record_dir, "agent.wav")
                    my_voice.export(agent_segments_path, format="wav")

                if other_segments:
                    other_voice = sum(other_segments)
                    cx_segments_path = os.path.join(call_record_dir, "others.wav")
                    other_voice.export(cx_segments_path, format="wav")

                timeline = []

                for role, path in [("agent", agent_segments_path), ("customer", cx_segments_path)]:
                    if not path or not os.path.exists(path):
                        continue

                    transcription = whisper_model.transcribe(
                        path,
                        fp16=True,
                        condition_on_previous_text=False,
                        no_speech_threshold=0.7,
                        temperature=0.2,
                        best_of=1,
                    )

                    full_text = transcription.get("text", "").strip()
                    if not full_text:
                        continue

                    logger.info("ROLE: %s", role)
                    logger.info("transcription: %s", full_text)
                    restored_text = self.punctuation_restore_model.restore_punctuation(full_text)

                    sentences = sent_tokenize(restored_text)

                    audio_segment = AudioSegment.from_file(path)
                    seg_np = np.array(audio_segment.get_array_of_samples()).astype(np.float32)
                    seg_np = seg_np / (2 ** 15)
                    sr = audio_segment.frame_rate

                    role_results = []
                    for sent in sentences:
                        text_sent = self._get_text_sentiment(sent)
                        audio_sent = self._get_audio_sentiment(seg_np, sr)
                        final_sent, final_conf = self._fuse_sentiment(text_sent, audio_sent)

                        role_results.append(
                            {
                                "sentence": sent,
                                "sentiment": final_sent,
                                "confidence": round(final_conf, 2),
                            }
                        )

                    if role_results:
                        timeline.append({role: role_results})

                sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
                total_sentences = 0
                for segment in timeline:
                    if "customer" in segment:
                        for utt in segment["customer"]:
                            sentiment = utt["sentiment"]
                            if sentiment in sentiment_counts:
                                sentiment_counts[sentiment] += 1
                            total_sentences += 1

                sentiment_percentages = {
                    k: (
                        f"{round((v / total_sentences) * 100, 2)}%"
                        if total_sentences > 0
                        else "0%"
                    )
                    for k, v in sentiment_counts.items()
                }

            return {"segments": timeline, "cx_sentiment_result": sentiment_percentages}

        except Exception as e:
            logger.exception("Error in analyze(): %s", e)
            if os.path.exists(call_record_dir):
                shutil.rmtree(call_record_dir, ignore_errors=True)
            raise

