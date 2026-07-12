#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python3 main_enhanced.py "$@"
deactivate
