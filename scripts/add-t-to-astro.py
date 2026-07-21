"""Add createT import and t() definition to all .astro component files that use {t(...)}."""
import re

files = [
    'src/components/About.astro',
    'src/components/Footer.astro',
    'src/components/Hero.astro',
    'src/components/LibreCourse.astro',
    'src/components/OpenSource.astro',
    'src/components/Projects.astro',
    'src/components/References.astro',
    'src/components/Studies.astro',
    'src/components/VigilStats.astro',
]

for fpath in files:
    with open(fpath) as f:
        content = f.read()

    if 'createT' in content:
        print(f'  already done: {fpath}')
        continue

    # Find the frontmatter bounds
    m = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not m:
        print(f'  no frontmatter: {fpath}')
        continue

    fm = m.group(1)

    # Insert createT import and t() definition at end of frontmatter
    insert = "\nimport { createT } from '../i18n';\nconst t = createT(Astro.props.lang);"

    new_fm = fm + insert
    new_content = '---\n' + new_fm + '\n---' + content[m.end():]
    with open(fpath, 'w') as f:
        f.write(new_content)
    print(f'  updated: {fpath}')
