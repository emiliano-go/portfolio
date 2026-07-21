"""Transform data-i18n attributes to {t('key')} template expressions.

Reads each .astro file, replaces data-i18n usage, writes back.
Handles:
  <span data-i18n="key">Text</span> → <span>{t('key')}</span>
  <span data-i18n="key" data-i18n-html>Text</span> → <span set:html={t('key')} />
  <a data-i18n="key" data-i18n-html>Text</a> → <a set:html={t('key')}>{t('key')}</a>
  data-i18n={`dynamic.${expr}`} → {t(`dynamic.${expr}`)}
"""
import re
import os

ASTRO_DIR = 'src'

def has_attr(tag: str, attr: str) -> bool:
    return re.search(rf'\b{re.escape(attr)}\b', tag) is not None

def transform_file(path: str):
    with open(path) as f:
        content = f.read()

    # Match opening tags with data-i18n
    # Pattern: <tag ... data-i18n="key" ...>child content</tag>
    pattern = re.compile(
        r'(<(\w+(?:-\w+)*)\b[^>]*?\bdata-i18n\s*=\s*"([^"]+)"[^>]*?>)(.*?)</\2>',
        re.DOTALL,
    )

    def replace_match(m):
        full_open = m.group(1)  # <tag ... data-i18n="key" ...>
        tag = m.group(2)         # tag name
        key = m.group(3)         # the i18n key
        child = m.group(4)       # content between open and close tags
        use_html = 'data-i18n-html' in full_open

        # Remove data-i18n and data-i18n-html attributes
        cleaned_open = re.sub(r'\s*\bdata-i18n(?:-html)?\s*=\s*"[^"]*"', '', full_open)

        if use_html:
            # <tag ...>content</tag>  →  <tag ... set:html={t('key')} />
            # Insert set:html before closing >
            if cleaned_open.rstrip().endswith('/>'):
                new_open = cleaned_open.rstrip()[:-2].rstrip() + f' set:html={{t("{key}")}} />'
            else:
                new_open = cleaned_open.rstrip()[:-1].rstrip() + f' set:html={{t("{key}")}}>'
            return new_open + '\n'
        else:
            # <tag ...>content</tag>  →  <tag ...>{t('key')}</tag>
            return cleaned_open + '{t("' + key + '")}</' + tag + '>'

    content = pattern.sub(replace_match, content)

    # Handle dynamic data-i18n with backticks: data-i18n={`studies.${i+1}.desc`}
    dyn_pattern = re.compile(
        r'(<(\w+(?:-\w+)?)\b[^>]*?\bdata-i18n\s*=\s*\{\x60([^}]+)\x60\}[^>]*?>)(.*?)</\2>',
        re.DOTALL,
    )

    def replace_dyn(m):
        full_open = m.group(1)
        tag = m.group(2)
        key_expr = m.group(3)
        child = m.group(4)
        use_html = 'data-i18n-html' in full_open

        cleaned_open = re.sub(r'\s*\bdata-i18n(?:-html)?\s*=\s*\{[^}]+\}', '', full_open)

        if use_html:
            if cleaned_open.rstrip().endswith('/>'):
                new_open = cleaned_open.rstrip()[:-2].rstrip() + f' set:html={{t(`{key_expr}`)}} />'
            else:
                new_open = cleaned_open.rstrip()[:-1].rstrip() + f' set:html={{t(`{key_expr}`)}}>'
            return new_open + '\n'
        else:
            return cleaned_open + '{t(`' + key_expr + '`)}</' + tag + '>'

    content = dyn_pattern.sub(replace_dyn, content)

    # Also handle data-i18n={link.key} pattern in Nav
    var_pattern = re.compile(
        r'(<(\w+(?:-\w+)?)\b[^>]*?\bdata-i18n\s*=\s*\{([\w.]+)\}[^>]*?>)(.*?)</\2>',
        re.DOTALL,
    )

    def replace_var(m):
        full_open = m.group(1)
        tag = m.group(2)
        var_expr = m.group(3)
        child = m.group(4)

        cleaned_open = re.sub(r'\s*\bdata-i18n\s*=\s*\{[^}]+\}', '', full_open)
        return cleaned_open + '{t(' + var_expr + ')}</' + tag + '>'

    content = var_pattern.sub(replace_var, content)

    with open(path, 'w') as f:
        f.write(content)

    print(f'  transformed: {path}')


def main():
    for root, dirs, files in os.walk(ASTRO_DIR):
        for f in files:
            if f.endswith('.astro'):
                path = os.path.join(root, f)
                transform_file(path)


if __name__ == '__main__':
    main()
