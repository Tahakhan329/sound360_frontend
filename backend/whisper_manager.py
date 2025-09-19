# whisper_manager.py
import whisper
import torch


class WhisperManager:
    _model = None

    @classmethod
    def get_model(cls, model_size="small", device=None):
        if cls._model is None:
            device = device or ("cuda" if torch.cuda.is_available() else "cpu")
            print(f"Loading Whisper model {model_size} on {device}")
            cls._model = whisper.load_model(model_size, device=device)
        return cls._model
