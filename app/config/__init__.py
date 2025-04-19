import os

from dotenv import dotenv_values

config = {
    **dotenv_values(".env"),
    **os.environ # For docker deployment
}


def check_config() -> None:
    if not config["DB_URI"]:
        raise ValueError("DB_URI is required!")
