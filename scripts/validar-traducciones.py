#!/usr/bin/env python3
"""Verifica que data/free-exercise-db/es/*.txt cubra el JSON original con el mismo número de pasos."""
import glob, json, sys

def leer_es(rutas):
    out = {}
    for ruta in sorted(rutas):
        actual = None
        for n, linea in enumerate(open(ruta, encoding='utf-8'), 1):
            linea = linea.rstrip('\n')
            if linea.startswith('## '):
                actual = linea[3:].strip()
                if actual in out:
                    sys.exit(f'{ruta}:{n}: id duplicado {actual}')
                out[actual] = {'nombre': None, 'pasos': []}
            elif not linea.strip():
                continue
            elif actual is None:
                sys.exit(f'{ruta}:{n}: texto fuera de un ejercicio')
            elif linea.startswith('- '):
                out[actual]['pasos'].append(linea[2:].strip())
            elif out[actual]['nombre'] is None:
                out[actual]['nombre'] = linea.strip()
            else:
                sys.exit(f'{ruta}:{n}: línea inesperada en {actual}')
    return out

def pasos_originales(x):
    # El origen trae algunos pasos vacíos; no se traducen.
    return [s for s in x['instructions'] if s.strip()]

if __name__ == '__main__':
    base = 'data/free-exercise-db'
    orig = {x['id']: x for x in json.load(open(f'{base}/exercises.json', encoding='utf-8'))}
    es = leer_es(glob.glob(f'{base}/es/*.txt'))
    errores = 0
    for i, t in es.items():
        if i not in orig:
            print('id desconocido:', i); errores += 1; continue
        if not t['nombre']:
            print('sin nombre:', i); errores += 1
        if len(t['pasos']) != len(pasos_originales(orig[i])):
            print(f"pasos {len(t['pasos'])} != {len(pasos_originales(orig[i]))}:", i); errores += 1
    print(f'{len(es)}/{len(orig)} traducidos, {errores} errores')
    sys.exit(1 if errores else 0)
