import os

from dotenv import dotenv_values

config = {
    **dotenv_values(".env"),
    **os.environ # For docker deployment
}


def check_config() -> None:
    required_env_vars = [
        'DB_URI',
        'JWT_SECRET_KEY',
        'ALGORITHM',
        'ACCESS_TOKEN_EXPIRE_MINUTES',
        'ENV',
        'CERTIFICATES_FOLDER_PATH',
    ]
    
    for var in required_env_vars:
        if var not in config:
            raise ValueError(f"{var} is required")