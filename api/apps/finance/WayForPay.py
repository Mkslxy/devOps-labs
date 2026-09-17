import logging
logger = logging.getLogger(__name__)

import hashlib
import hmac

import requests


class WayForPay:
    API_URL = "https://api.wayforpay.com/api"

    def __init__(self, account, key, domain):
        self.account = account
        self.key = key
        self.domain = domain

    def get_answer_signature(self, data):
        order_reference = data["orderReference"]
        status = data["status"]
        time = data["time"]

        signature_text = (
            f"{order_reference};"
            f"{status};"
            f"{time}"
        )
        signature = hmac.new(self.key.encode("utf-8"), signature_text.encode("utf-8"), hashlib.md5).hexdigest()
        return signature

    def get_signature(self, data):
        order_reference = data['orderReference']
        order_date = data['orderDate']
        amount = data['amount']
        currency = data['currency']
        product_names: list = data['productName']
        product_counts: list = data['productCount']
        product_prices: list = data['productPrice']

        signature_text = (
            f"{self.account};"
            f"{self.domain};"
            f"{order_reference};"
            f"{order_date};"
            f"{amount};"
            f"{currency};"
            f"{";".join(product_names)};"
            f"{";".join(str(count) for count in product_counts)};"
            f"{";".join(str(price) for price in product_prices)}"
        )
        signature = hmac.new(
            self.key.encode("utf-8"),
            signature_text.encode("utf-8"),
            hashlib.md5
        ).hexdigest()
        return signature

    def create_invoice(self, data):
        try:
            body = {
                "merchantSignature": self.get_signature(data),
                "merchantAccount": self.account,
                "merchantDomainName": self.domain,
                "transactionType": "CREATE_INVOICE",
                "apiVersion": "1",
                "language": "ua",
                "notifyMethod": "email"
            }
            body.update(data)
            headers = {"Content-Type": "application/json"}

            response = requests.post(self.API_URL, json=body, headers=headers)

            if response.text == "Api cannot read incoming request data. Unknown format":
                raise ValueError("Unknown format")

            return response.json()


        except KeyError as e:
            raise KeyError(f"No required argument – {e}")
        except Exception as e:
            raise e
