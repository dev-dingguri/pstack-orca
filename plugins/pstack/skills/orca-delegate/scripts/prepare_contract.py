"""Reserve a contract in the common Git directory (Python 3.10+)."""

import argparse
import json
from pathlib import Path
import re
import subprocess


def git(root, *args):
    return subprocess.run(
        ['git', '-C', str(root), *args], capture_output=True, text=True,
        encoding='utf-8', errors='replace', check=False,
    )


def output(root, *args):
    result = git(root, *args)
    if result.returncode:
        raise ValueError(result.stderr.strip() or 'Git command failed')
    return result.stdout.strip()


def prepare(worktree, call_id):
    root = Path(worktree)
    if not root.is_absolute():
        raise ValueError('worktree must be an absolute path')
    root = root.resolve(strict=True)
    if Path(output(root, 'rev-parse', '--show-toplevel')).resolve() != root:
        raise ValueError('worktree must name the Git worktree root')
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', call_id):
        raise ValueError('call-id must contain only letters, digits, underscores and hyphens')

    common = Path(output(root, 'rev-parse', '--path-format=absolute', '--git-common-dir')).resolve(strict=True)
    contract = common / 'task-contracts' / call_id / 'contract.md'
    for path in (common / 'task-contracts', contract.parent):
        if path.resolve() != path:
            raise ValueError(f'Redirected contract directory is not supported: {path}')
    if contract.parent.exists():
        raise ValueError('call-id directory already exists; use a new call-id')

    contract.parent.parent.mkdir(parents=True, exist_ok=True)
    contract.parent.mkdir()  # Exclusive reservation; never overwrite another call.
    with contract.open('x', encoding='utf-8'):
        pass
    return {
        'contract_path': str(contract), 'call_directory': str(contract.parent),
        'git_common_directory': str(common),
        'next_step': 'Write the contract with a file-editing tool, then read it before dispatch.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worktree', required=True)
    parser.add_argument('--call-id', required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(prepare(args.worktree, args.call_id)))
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
