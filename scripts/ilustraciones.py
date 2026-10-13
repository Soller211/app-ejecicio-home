#!/usr/bin/env python3
"""Genera static/ilustraciones/*.svg: figuras simples para los ejercicios sin foto en el catálogo.

Cada pose define articulaciones (x, y). Las extremidades "lejanas" se dibujan en gris para dar profundidad.
Uso: python3 scripts/ilustraciones.py
"""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'static', 'ilustraciones')
CERCA, LEJOS, ACENTO, PISO = '#2b3240', '#9aa3b5', '#13a456', '#d3d8e0'


def linea(pts, color, w=13):
    d = ' '.join(f'{x},{y}' for x, y in pts)
    return f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def figura(p):
    """p: dict con head, neck, hip, y brazos/piernas lejanos (bl, pl) y cercanos (bc, pc): [codo/rodilla, mano/pie]."""
    s = []
    s.append(linea([p['neck'], *p['bl']], LEJOS))
    s.append(linea([p['hip'], *p['pl']], LEJOS))
    s.append(linea([p['neck'], p['hip']], CERCA, 16))
    s.append(linea([p['hip'], *p['pc']], CERCA))
    s.append(linea([p['neck'], *p['bc']], CERCA))
    hx, hy = p['head']
    s.append(f'<circle cx="{hx}" cy="{hy}" r="21" fill="{CERCA}"/>')
    return '\n'.join(s)


def svg(nombre, pose, extra_antes='', extra_despues=''):
    contenido = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="{nombre}">
<rect width="400" height="300" fill="#ffffff"/>
<line x1="20" y1="276" x2="380" y2="276" stroke="{PISO}" stroke-width="6" stroke-linecap="round"/>
{extra_antes}
{figura(pose)}
{extra_despues}
</svg>
'''
    with open(os.path.join(OUT, nombre + '.svg'), 'w', encoding='utf-8') as f:
        f.write(contenido)


def P(head, neck, hip, bl, bc, pl, pc):
    return dict(head=head, neck=neck, hip=hip, bl=bl, bc=bc, pl=pl, pc=pc)


# Jumping jacks (de frente)
svg('jumping-jacks-1', P((200, 62), (200, 95), (200, 180),
    [(178, 135), (170, 176)], [(222, 135), (230, 176)],
    [(190, 225), (188, 270)], [(210, 225), (212, 270)]))
svg('jumping-jacks-2', P((200, 52), (200, 85), (200, 170),
    [(158, 62), (140, 24)], [(242, 62), (260, 24)],
    [(172, 218), (148, 262)], [(228, 218), (252, 262)]))

# Burpees (de lado, mirando a la derecha)
svg('burpees-1', P((205, 58), (200, 90), (198, 172),
    [(208, 130), (214, 166)], [(214, 128), (222, 164)],
    [(192, 222), (190, 270)], [(204, 222), (206, 270)]))
svg('burpees-2', P((258, 128), (232, 150), (172, 205),
    [(246, 210), (258, 270)], [(252, 210), (266, 270)],
    [(210, 214), (186, 270)], [(222, 214), (198, 270)]))
svg('burpees-3', P((322, 176), (294, 192), (190, 214),
    [(290, 232), (288, 270)], [(300, 232), (300, 270)],
    [(132, 242), (74, 268)], [(136, 238), (80, 262)]))
svg('burpees-4', P((204, 46), (200, 78), (198, 156),
    [(176, 50), (166, 14)], [(226, 50), (238, 14)],
    [(192, 200), (186, 246)], [(206, 200), (204, 246)]))

# Rodillas al pecho / skipping (de lado)
svg('rodillas-al-pecho-1', P((206, 58), (200, 90), (196, 170),
    [(222, 126), (242, 104)], [(180, 128), (170, 160)],
    [(196, 222), (194, 270)], [(242, 160), (236, 212)]))
svg('rodillas-al-pecho-2', P((206, 58), (200, 90), (196, 170),
    [(180, 128), (170, 160)], [(222, 126), (242, 104)],
    [(242, 160), (236, 212)], [(196, 222), (194, 270)]))

# Sentadilla isométrica en pared (pared a la izquierda)
PARED = f'<rect x="96" y="20" width="24" height="256" fill="{PISO}"/>'
svg('sentadilla-pared-1', P((144, 58), (140, 90), (138, 172),
    [(150, 130), (156, 166)], [(160, 130), (168, 166)],
    [(140, 222), (142, 270)], [(146, 222), (150, 270)]), PARED)
svg('sentadilla-pared-2', P((144, 112), (140, 144), (140, 218),
    [(176, 156), (208, 150)], [(180, 166), (212, 160)],
    [(212, 214), (210, 270)], [(220, 218), (220, 270)]), PARED)

# Pike push-up (de lado)
svg('pike-push-up-1', P((268, 222), (252, 196), (180, 120),
    [(264, 234), (272, 270)], [(268, 234), (280, 270)],
    [(146, 196), (116, 270)], [(152, 196), (124, 270)]))
svg('pike-push-up-2', P((280, 248), (258, 222), (186, 136),
    [(236, 236), (272, 270)], [(242, 240), (280, 270)],
    [(150, 204), (116, 270)], [(156, 204), (124, 270)]))

# Remo con banda elástica (sentado en el piso, banda en los pies)
def banda(mano):
    mx, my = mano
    return (f'<polyline points="{mx},{my} 300,246 {mx},{my + 6}" fill="none" stroke="{ACENTO}" '
            f'stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>')

svg('remo-banda-1', P((196, 128), (178, 158), (146, 246),
    [(226, 196), (272, 226)], [(232, 202), (280, 232)],
    [(212, 246), (282, 260)], [(216, 250), (290, 266)]),
    extra_despues=banda((276, 229)))
svg('remo-banda-2', P((186, 124), (168, 154), (146, 246),
    [(130, 190), (176, 200)], [(136, 196), (184, 206)],
    [(212, 246), (282, 260)], [(216, 250), (290, 266)]),
    extra_antes=banda((180, 203)))

print('ok', sorted(os.listdir(OUT)))
