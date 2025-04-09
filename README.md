# NPTEL Automation API

## Setup

To start contributing to the project, follow these steps:

### 1. Create a Python Virtual Environment

Using a virtual environment helps keep your project's dependencies isolated. Follow the steps below based on your
operating system:

#### For Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

#### For Linux/MacOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Project Requirements

After activating your virtual environment, install the required packages:

```bash
pip install -r requirements.txt
```

### 3. Populate environment variables

Copy the `.env.example` file into `.env` and add all key values.

### 4. Start development server

```bash
fastapi dev app/main.py --reload
```

## Contributing Guidelines

Make sure the following guidelines are followed:

- Make commits in a new branch, and then add a pull request to the test branch.
- Make sure you run `pip freeze > requirements.txt` in the root of the project before pushing, to ensure a seamless
  development experience for others.
- Ensure best practices like using docstrings and typing using Pydantic and typing package of Python.

## License

This project is licensed with MIT License. For more details, click [here](LICENSE).