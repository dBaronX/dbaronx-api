import os
import requests
from telegram.ext import ApplicationBuilder, CommandHandler

API = os.environ["FASTAPI_URL"]
TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

async def start(update, context):
    await update.message.reply_text("Welcome to dBaronX 🚀")

async def dreams(update, context):
    res = requests.get(f"{API}/dreams").json()
    text = "\n".join([f"{d['title']} ({d['raised']}/{d['goal']})" for d in res])
    await update.message.reply_text(text)

async def story(update, context):
    prompt = " ".join(context.args)
    res = requests.post(f"{API}/ai/story", json={"prompt": prompt}).json()
    await update.message.reply_text(res["story"])
API = os.environ["FASTAPI_URL"]

async def presale(update, context):
    await update.message.reply_text(
        "Submit via form: https://dbaronx.com/presale"
    )

async def mycommitment(update, context):
    wallet = context.args[0]

    res = requests.get(f"{API}/user/{wallet}")
    await update.message.reply_text(str(res.json()))
def run():
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("dreams", dreams))
    app.add_handler(CommandHandler("story", story))
    app.run_polling()

if __name__ == "__main__":
    run()