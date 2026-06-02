#!/usr/bin/env python3
"""生成 iOS PWA 所需的全部尺寸图标"""
from PIL import Image
import os

src = Image.open('public/icon-512.png').convert('RGBA')
sizes = {
    'apple-touch-icon-120x120': 120,
    'apple-touch-icon-152x152': 152,
    'apple-touch-icon-167x167': 167,
    'apple-touch-icon-180x180': 180,
    'icon-72x72': 72,
    'icon-96x96': 96,
    'icon-128x128': 128,
    'icon-144x144': 144,
    'icon-384x384': 384,
}
for name, size in sizes.items():
    resized = src.resize((size, size), Image.LANCZOS)
    filepath = f'public/{name}.png'
    resized.save(filepath, 'PNG')
    print(f'OK: {filepath} ({size}x{size})')
print(f'Done: {len(sizes)} icons generated')
