from UniSchool import settings
from django.core.management.base import BaseCommand
import requests


# python manage.py telegram_webhook --set
# python manage.py telegram_webhook --info
# python manage.py telegram_webhook --delete

class Command(BaseCommand):
    help = "Manage Telegram webhook"

    def add_arguments(self, parser):
        parser.add_argument(
            "--set",
            action="store_true",
            help="Set or update webhook"
        )
        parser.add_argument(
            "--delete",
            action="store_true",
            help="Delete webhook"
        )
        parser.add_argument(
            "--info",
            action="store_true",
            help="Get webhook info"
        )

    def handle(self, *args, **options):
        token = settings.TG_TOKEN
        base_url = f"https://api.telegram.org/bot{token}"

        if options["set"]:
            self.set_webhook(base_url)
        elif options["delete"]:
            self.delete_webhook(base_url)
        elif options["info"]:
            self.webhook_info(base_url)
        else:
            self.stdout.write("Use --set, --delete or --info")

    def set_webhook(self, base_url):
        r = requests.post(
            f"{base_url}/setWebhook",
            json={
                "url": settings.TG_WEBHOOK_URL,
                "secret_token": settings.TG_SECRET,
                "drop_pending_updates": True,
            },
            timeout=10
        )
        self._print_result("Set webhook", r)

    def delete_webhook(self, base_url):
        r = requests.post(
            f"{base_url}/deleteWebhook",
            json={"drop_pending_updates": True},
            timeout=10
        )
        self._print_result("Delete webhook", r)

    def webhook_info(self, base_url):
        r = requests.get(f"{base_url}/getWebhookInfo", timeout=10)
        self._print_result("Webhook info", r)

    def _print_result(self, title, response):
        data = response.json()
        if data.get("ok"):
            self.stdout.write(self.style.SUCCESS(f"✅ {title} success"))
            self.stdout.write(str(data["result"]))
        else:
            self.stderr.write(self.style.ERROR(f"❌ {title} failed: {data}"))
