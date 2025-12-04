# Python Installation

Install Smoosense in your Python environment:

```bash
pip install -U smoosense
```

## Usage

Import and use Smoosense in your Python code:

```py
from smoosense.app import SmooSenseApp

app = SmooSenseApp().create_app()

@app.route('/your-other-page')
def your_other_page():
    return 'hello world'

def start():
    app.run(port=8000)

if __name__ == '__main__':
    start()
```
