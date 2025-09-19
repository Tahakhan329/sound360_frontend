from TTS.api import TTS
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    pipeline,
    BitsAndBytesConfig,
)

import torch.nn as nn
import torch


llm_model_id = "Qwen/Qwen2.5-1.5B-Instruct"

device = "cuda" if torch.cuda.is_available() else "cpu"
print("DEVICE: ", device)

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

llm_tokenizer = AutoTokenizer.from_pretrained(llm_model_id, use_fast=True)
llm_model = AutoModelForCausalLM.from_pretrained(
    llm_model_id,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True,
    offload_state_dict=True,
    # attn_implementation="flash_attention_2",
    trust_remote_code=True,
)

llm_pipeline = pipeline(
    "text-generation",
    model=llm_model,
    tokenizer=llm_tokenizer,
)

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

if llm_pipeline and tts:
    print("All Models loaded successfully bro.. ")
