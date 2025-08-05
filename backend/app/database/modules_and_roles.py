from typing import Dict, List

def get_avlokan_module_names() -> Dict[str, str]:
    return {
        "nptel": "nptel"
    }

def get_avlokan_roles() -> Dict[str, List[str]]:
    modules = get_avlokan_module_names()
    return {
        modules["nptel"]: ["student", "mentor", "coordinator"]
    }