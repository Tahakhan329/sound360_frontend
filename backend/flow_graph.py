from lingua import Language, LanguageDetectorBuilder
import re
from langgraph.graph import StateGraph, END
import asyncio
from typing import Dict, Optional


async def check_balance(state):
    """Handle balance check queries."""
    fact = {"topic": "balance inquiry", "current_balance": "250 SAR"}  
    sm = state["sm"]

    system_info = {
        "role": "system",
        "content": (
            f"Your task: Convert the following fact into a single, polite, natural sentence in "
            f"'{state['language']}' addressing the USER directly.\n\n"
            f"Fact (structured): {fact}\n\n"
            f"Rules:\n"
            f"- Always phrase from the assistant to the USER, not from the assistant’s own perspective.\n"
            f"- Use 'Your' (not 'My'). Example: 'Your current balance is 250 SAR.'\n"
            f"- Translate into '{state['language']}' if needed.\n"
            f"- Do NOT output JSON, dictionaries, or keys. Only output a natural-language sentence.\n"
            f"- Do NOT ask follow-up questions or add extra info. Only state the fact.\n"
        ),
    }

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={**sm, "chat_history": [system_info]},
        interal_flow=False,
    )

    state["result"] = llm_response
    return state


async def query_status(state):
    """Handle query status requests."""
    tracker_id = state.get("tracker_id", "123")
    fact = {"topic": "query status", "tracker_id": tracker_id, "status": "In Progress"}
    sm = state["sm"]

    system_info = {
        "role": "system",
        "content": (
            f"Your task: Convert the following fact into a single, polite, natural sentence in "
            f"'{state['language']}' for the user. Fact (structured): {fact}. "
            f"Rules:\n"
            f"- Translate into '{state['language']}' if needed.\n"
            f"- Do NOT output JSON, dictionaries, or keys. Output must be a natural-language sentence.\n"
            f"- Do NOT ask follow-up questions or add extra info. Only state the fact.\n"
        ),
    }

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={**sm, "chat_history": [system_info]},
        interal_flow=False,
    )

    state["result"] = llm_response
    return state


async def generate_complaint(state):
    """Handle complaint registration."""
    complaint_id = state.get("complaint_id", "C12345")
    fact = {
        "topic": "register complaint",
        "complaint_id": complaint_id,
        "status": "successful",
    }
    sm = state["sm"]

    system_info = {
        "role": "system",
        "content": (
            f"Your task: Convert the following fact into a single, polite, natural sentence in "
            f"'{state['language']}' for the user. Fact (structured): {fact}. "
            f"Rules:\n"
            f"- Translate into '{state['language']}' if needed.\n"
            f"- Do NOT output JSON, dictionaries, or keys. Output must be a natural-language sentence.\n"
            f"- Do NOT ask follow-up questions or add extra info. Only state the fact.\n"
        ),
    }

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={**sm, "chat_history": [system_info]},
        interal_flow=False,
    )

    state["result"] = llm_response
    return state


async def route_to_call_agent(state):
    """Route user to call agent."""
    fact = {"topic": "routing to human agent", "reason": "further assistance"}
    sm = state["sm"]

    system_info = {
        "role": "system",
        "content": (
            f"Your task: Inform the user in a single, polite, natural sentence in '{state['language']}' that "
            f"you will route them to a human agent. Fact (structured): {fact}. "
            f"Rules:\n"
            f"- Translate into '{state['language']}' if needed.\n"
            f"- Do NOT output JSON, dictionaries, or keys. Output must be a natural-language sentence.\n"
            f"- Do NOT ask follow-up questions. Only state that routing will happen and be polite.\n"
        ),
    }

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={**sm, "chat_history": [system_info]},
        interal_flow=False,
    )

    state["result"] = llm_response
    return state


async def ai_reply(state):
    sm = state["sm"]
    conversation_history = sm.get("chat_history", [])

    labeled_history = []
    for i, msg in enumerate(conversation_history, start=1):
        role = msg["role"].upper()
        content = msg["content"]
        labeled_history.append(f'{i}. {role}: "{content}"')

    system_info = {
        "role": "system",
        "content": (
            f"You are a helpful conversational AI assistant.\n"
            f"The conversation language is '{state['language']}'.\n\n"
            f"Conversation summary for reference:\n"
            + "\n".join(labeled_history)
            + "\n\n"
            f"Rules:\n"
            f"- Always use the numbered conversation history above to answer.\n"
            f"- Normalize variations of user queries:\n"
            f"   • If the user asks 'What was my last message?', respond naturally (not verbatim). "
            f"For example: if the last user message was 'Hi, this is Zaid', reply with something like "
            f"'You told me your name, Zaid.'\n"
            f"   • If the user asks 'What did I just ask?', 'What did I ask you?', "
            f"'What was the last thing I told you?', or 'What was the last thing I requested you?', "
            f"respond by rephrasing the most recent USER message before the current one in natural language. "
            f"Example: if they said 'I want to know my balance', respond with 'You asked me to check your balance.'\n"
            f"   • If the user asks 'What did I say earlier?', use the numbered history to recall the appropriate "
            f"USER message further back, but rephrase it naturally.\n"
            f"   • If the user asks 'What was your last reply?', respond with: "
            f"My last reply was, and then summarize/paraphrase the most recent ASSISTANT reply naturally.\n"
            f"- Do not just echo exact words unless necessary. Rephrase to sound conversational and human-like.\n"
            f"- If the user asks about messages 3–4 turns ago (or older), use the history numbering to locate it, "
            f"but summarize naturally.\n"
            f"- Otherwise, reply according to context in a natural, human-like way.\n"
            f"- Never output JSON, keys, or metadata.\n"
        ),
    }

    messages = [system_info] + conversation_history

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={"chat_history": messages},
        interal_flow=False,
        max_tokens=300,
    )

    state["result"] = llm_response
    return state


async def end_conversation(state):
    """End the conversation politely. Must only produce a farewell sentence."""
    sm = state["sm"]

    system_info = {
        "role": "system",
        "content": (
            f"Your task: Produce a single, short, polite farewell sentence in '{state['language']}'. "
            f"Rules:\n"
            f"- ONLY output the farewell (no questions, no new topics, no extra instructions).\n"
            f"- Translate into '{state['language']}' if needed.\n"
            f"- Examples (English): 'Goodbye, have a nice day.' (Arabic): 'مع السلامة، نتمنى لك يوماً سعيداً.'\n"
        ),
    }

    llm_response = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm={**sm, "chat_history": [system_info]},
        interal_flow=False,
    )

    state["result"] = llm_response
    return state


async def decide_next(state):
    goal = state["goal"]
    lang = state["language"]
    sm = state["sm"]

    if len(sm.get("chat_history", [])) > 1:
        relevant_chat_history = sm["chat_history"][1:][-3:]
    else:
        relevant_chat_history = []

    chat_history = relevant_chat_history

    router_prompt = f"""
        You are an action selector. The user's request language is {lang}.
        Some relevant chat history (most recent in last.): {chat_history}
        Only decide the correct action based on the meaning of the user's request.

        User's goal: "{goal}"

        Valid actions:
        - check_balance → If the user explicitly asks about their account balance (e.g., 'what is my balance', 'رصيدي').
        - query_status → If the user asks about the status of a previously raised query/tracker (e.g., 'status of my complaint', 'tracker').
        - generate_complaint → If the user explicitly requests to register a NEW complaint.
        - route_to_call_agent → If the user explicitly requests escalation, cancellation, closing account, or demands a human agent (e.g., 'I want to talk to a manager', 'please connect me to human').
        - ai_reply → 
            • If it's chit-chat, greeting, or small talk.  
            • If it's an out-of-scope general request (like weather, news, jokes, general info).  
            • If the user asks about their past messages OR your past replies (conversation history recall).  
        - END → If the user says goodbye or ends the conversation. Examples: 'bye', 'goodbye', 'see you', 'take care', 'مع السلامة', 'وداعا'.

        IMPORTANT:
        - Questions like "What did I say earlier?", "What was the last thing I told you?", or "What did you reply before?" 
        MUST map to ai_reply (not query_status).
        - Output EXACTLY one action name from the list above and nothing else.
        - Use the chat history to disambiguate if needed.
        """

    decision = await llm_call(
        llm_tokenizer=state["tokenizer"],
        llm_pipeline=state["llm"],
        sm=state["sm"],
        interal_flow=True,
        goal=router_prompt,
        max_tokens=60,
    )

    # print("MATCH: ", decision)
    match = re.search(
        r"(check_balance|query_status|generate_complaint|route_to_call_agent|ai_reply|END)",
        decision,
        re.IGNORECASE,
    )
    if match:
        decision = match.group(1)
    else:
        decision = "ai_reply"

    # decision= "ai_reply"

    print("=" * 30)
    print("DECISION:", decision)
    print("=" * 30)
    return {"__next__": decision}


class State(dict):
    sm: Optional[Dict]
    user_id: str
    goal: str
    tracker_id: str
    result: str
    decision: str
    language: str
    llm: object
    tokenizer: object


workflow = StateGraph(State)

workflow.add_node("decide", decide_next)
workflow.add_node("check_balance", check_balance)
workflow.add_node("query_status", query_status)
workflow.add_node("generate_complaint", generate_complaint)
workflow.add_node("ai_reply", ai_reply)
workflow.add_node("route_to_call_agent", route_to_call_agent)
workflow.add_node("end_conversation", end_conversation)

workflow.set_entry_point("decide")

workflow.add_conditional_edges(
    "decide",
    lambda state: state["__next__"],
    {
        "check_balance": "check_balance",
        "query_status": "query_status",
        "generate_complaint": "generate_complaint",
        "ai_reply": "ai_reply",
        "route_to_call_agent": "route_to_call_agent",
        "END": "end_conversation",
    },
)

workflow.add_edge("end_conversation", END)

flow = workflow.compile()


async def llm_call(
    llm_tokenizer, llm_pipeline, sm, interal_flow=False, goal="", max_tokens=50
):
    """
    llm_call wraps the pipeline invocation.
    - If interal_flow == False, we treat sm['chat_history'] as the messages to the model (action-specific prompts should
      pass a chat_history with only the action system_info to avoid leakage).
    - If interal_flow == True, we prepare a classification-style single system message using `goal`.
    """
    if not interal_flow:
        prompt = llm_tokenizer.apply_chat_template(
            sm["chat_history"], tokenize=False, add_generation_prompt=True
        )
    else:
        messages = [{"role": "system", "content": goal}]
        prompt = llm_tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

    outputs = await asyncio.to_thread(
        llm_pipeline, prompt, max_new_tokens=max_tokens, do_sample=False
    )
    raw_text = outputs[0].get("generated_text", "")
    # print("==== RAW TEXT ====")
    # print(raw_text)
    # print("==== RAW TEXT ====")

    if "<|im_start|>assistant" in raw_text:
        reply = raw_text.split("<|im_start|>assistant\n")[-1]
        llm_response = reply.split("<|im_end|>")[0].strip()
    else:
        llm_response = raw_text.strip()

    return llm_response


class Agent:
    def __init__(self):
        self.language_detector = LanguageDetectorBuilder.from_languages(
            Language.ENGLISH, Language.ARABIC
        ).build()

    async def detect_language(self, text: str) -> str:
        """Detect language asynchronously using asyncio.to_thread"""
        lang = await asyncio.to_thread(self.language_detector.detect_language_of, text)
        if lang is None:
            return "ar"  # default fallback
        return "ar" if lang.iso_code_639_1.name.lower() == "ar" else "en"

    async def invoke(self, sm, llm_tokenizer, llm_pipeline):
        print("======ENTERED IN AGENTIC AI======")

        user_id = sm["user_id"]
        goal = sm["text_for_llm"]

        sm["chat_history"].append({"role": "user", "content": goal})

        lang = await self.detect_language(goal)
        full_form_lang = "Arabic" if lang == "ar" else "English"

        outputs = await flow.ainvoke(
            {
                "sm": sm,
                "user_id": user_id,
                "goal": goal,
                "language": full_form_lang,
                "llm": llm_pipeline,
                "tokenizer": llm_tokenizer,
            }
        )

        sm["chat_history"].append({"role": "assistant", "content": outputs["result"]})

        print("=" * 30)
        return outputs["result"], lang
