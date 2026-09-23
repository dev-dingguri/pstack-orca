import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from prepare_contract import prepare


class ContractStorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve() / 'repo with spaces'
        self.root.mkdir()
        self.git('init', '-q')

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], text=True).strip()

    def test_cli_preserves_ignore_files_and_legacy_contract(self):
        exclude = self.root / '.git/info/exclude'
        before = exclude.read_bytes()
        legacy = self.root / '.orca/task-contracts/run-one/contract.md'
        legacy.parent.mkdir(parents=True)
        legacy.write_text('legacy', encoding='utf-8')
        ignore = self.root / '.gitignore'
        ignore.write_text('/.orca/\n', encoding='utf-8')
        status = self.git('status', '--porcelain')
        result = subprocess.run([
            sys.executable, '-B', str(Path(__file__).with_name('prepare_contract.py')),
            '--worktree', str(self.root), '--call-id', 'run-one',
        ], text=True, capture_output=True, check=True)
        receipt = json.loads(result.stdout)
        contract = Path(receipt['contract_path'])
        self.assertEqual(contract, self.root / '.git/task-contracts/run-one/contract.md')
        self.assertEqual(contract.read_bytes(), b'')
        self.assertEqual(Path(receipt['git_common_directory']), self.root / '.git')
        self.assertEqual(exclude.read_bytes(), before)
        self.assertEqual(ignore.read_text(), '/.orca/\n')
        self.assertEqual(legacy.read_text(), 'legacy')
        self.assertEqual(self.git('status', '--porcelain'), status)

    def test_existing_contract_is_not_overwritten(self):
        contract = Path(prepare(self.root, 'run-one')['contract_path'])
        contract.write_text('existing café contract', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            prepare(self.root, 'run-one')
        self.assertEqual(contract.read_text(encoding='utf-8'), 'existing café contract')

    def test_unsafe_call_ids_and_nonroot_are_rejected(self):
        for call_id in ('../escape', '/absolute', 'a/b', 'a\\b', '..', 'a:b'):
            with self.subTest(call_id=call_id), self.assertRaises(ValueError):
                prepare(self.root, call_id)
        child = self.root / 'child'
        child.mkdir()
        with self.assertRaisesRegex(ValueError, 'worktree root'):
            prepare(child, 'run-one')
        self.assertFalse((self.root / '.git/task-contracts').exists())

    def test_redirected_directories_are_rejected(self):
        outside = Path(self.temp.name) / 'outside'
        outside.mkdir()
        for relative in ('task-contracts', 'task-contracts/run-one'):
            with self.subTest(relative=relative):
                link = self.root / '.git' / relative
                link.parent.mkdir(exist_ok=True)
                if sys.platform == 'win32':
                    import _winapi
                    _winapi.CreateJunction(str(outside), str(link))
                else:
                    link.symlink_to(outside, target_is_directory=True)
                try:
                    with self.assertRaisesRegex(ValueError, 'Redirected'):
                        prepare(self.root, 'run-one')
                    self.assertEqual(list(outside.iterdir()), [])
                finally:
                    if sys.platform == 'win32':
                        link.rmdir()
                    else:
                        link.unlink()

    def test_linked_worktree_shares_namespace_and_survives_cleanup(self):
        self.git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid',
                 'commit', '--allow-empty', '-qm', 'fixture')
        linked = Path(self.temp.name).resolve() / 'linked with spaces'
        self.git('worktree', 'add', '--detach', str(linked))
        contract = Path(prepare(linked, 'run-linked')['contract_path'])
        self.assertEqual(contract, self.root / '.git/task-contracts/run-linked/contract.md')
        contract.write_text('verify café contract reading', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            prepare(self.root, 'run-linked')
        for worktree in (self.root, linked):
            result = subprocess.check_output([
                sys.executable, '-B', '-c',
                'import pathlib,sys; sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())',
                str(contract),
            ], cwd=worktree)
            self.assertEqual(result.decode('utf-8'), 'verify café contract reading')
        # Cleanup targets only this disposable fixture.
        self.assertTrue(linked.is_relative_to(Path(self.temp.name).resolve()))
        subprocess.run(['git', '-C', str(linked), 'clean', '-fdx'], check=True)
        self.git('worktree', 'remove', str(linked))
        self.assertEqual(contract.read_text(encoding='utf-8'), 'verify café contract reading')
        self.assertEqual(self.git('status', '--porcelain'), '')
        self.assertFalse((self.root / '.orca').exists())


if __name__ == '__main__':
    unittest.main()
