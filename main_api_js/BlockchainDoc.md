# Blockchain API Documentation

Establishing a connection with the blockchain API involves a single endpoint.
This endpoint sends the required data and receives a confirmation response
indicating that a blockchain-based election has been successfully created,
along with additional related data.

برقراری ارتباط با API بلاک‌چین شامل یک اندپوینت (نقطه‌ی دسترسی) است.
این اندپوینت داده‌های مورد نیاز را ارسال کرده و پاسخی به عنوان تأیید دریافت می‌کند
که نشان می‌دهد انتخابات مبتنی بر بلاک‌چین با موفقیت ایجاد شده است،
به‌همراه برخی اطلاعات مرتبط دیگر.

### POST
Sending the required data to deploy the election contract and initiating related 
transactions to create an abstract wallet account for each voter.

ارسال داده‌های مورد نیاز برای دیپلوی قرارداد
 انتخابات و انجام تراکنش‌های مرتبط به‌منظور ایجاد کیف پول انتزاعی برای هر رأی‌دهنده.

- endpoint/StartElection


#### Main API Request:

```json
{
    "user": [
        {
            "id": "string",
            "phoneNumber": "string",
            "publicKey": "string",
        }
    ],
    "electionVoter": [
        {
            "userId": "string",
            "shareCount" : "int",
            "voterAccount" : "string"
        }
    ],
    "election": {
        "voterCount": "int",
        "numberOfCandidates": "int"
    }
}
```
#### Blockchain API Response:

1. __200 OK__ 
```json
{
    "message": "Election Created Succesfully",
    "TVotingAddress": "string",
    "PaymasterAddress": "string"
}
```

2. __400 Bad Request__ 
```json
{
    "message": "Bad Request",
}
```

3. __500 Intenal Server Error__ 
```json
{
    "message": "Internal Server Error",
}
```

### POST
Sending the number of required abstract wallets and the target network 
information to deploy them for voters. The main API will receive an array 
of account addresses to be stored in the voterAccount table.

ارسال تعداد کیف‌پول‌های انتزاعی مورد نیاز و اطلاعات شبکه‌ٔ مورد نظر برای دیپلوی آن‌ها برای رأی‌دهندگان.
API اصلی یک آرایه از آدرس حساب‌ها دریافت می‌کند تا در جدول voterAccount ذخیره شوند.

- endpoint/deployVoterAccounts

#### Main API Request:

```json
{
    "numberOfVoterAccountsToDeploy": "int",
    "network": "string"
}
```

#### Blockchain API Response:

```json
{
    "voterAccount": [
        "string"
    ]
}
```