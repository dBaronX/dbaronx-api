import os
from fastapi import FastAPI, Request
from supabase import create_client
import openai

app = FastAPI()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_KEY"]
)

openai.api_key = os.environ["OPENAI_API_KEY"]

@app.get("/")
def root():
    return {"status": "services running"}

# 🔹 PRESALE (Zoho webhook)
@app.post("/presale")
async def presale(req: Request):
    data = await req.json()

    res = supabase.table("presale_commitments").insert({
        "wallet_address": data.get("wallet"),
        "commitment_amount": data.get("commitment_amount")
    }).execute()

    return {"ok": True, "data": res.data}

# 🔹 DREAMS (Crowdfunding)
@app.post("/dreams")
async def create_dream(req: Request):
    data = await req.json()

    supabase.table("dreams").insert(data).execute()
    return {"ok": True}

@app.get("/dreams")
def list_dreams():
    return supabase.table("dreams").select("*").execute().data

# 🔹 BACK DREAM
@app.post("/dreams/back")
async def back_dream(req: Request):
    data = await req.json()

    supabase.table("dreams").update({
        "raised": supabase.raw("raised + %s", data["amount"])
    }).eq("id", data["dream_id"]).execute()

    return {"ok": True}

# 🔹 AI STORIES
@app.post("/ai/story")
async def ai_story(req: Request):
    data = await req.json()

    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=data["prompt"],
        max_tokens=300
    )

    story = response.choices[0].text.strip()

    supabase.table("ai_stories").insert({
        "prompt": data["prompt"],
        "story": story
    }).execute()

    return {"story": story}