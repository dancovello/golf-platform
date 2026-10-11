# ops/

- `backup-recipient.txt`: the **public** half of the backup encryption key (age). It can only
  *lock* backups. The private half that unlocks them is only in Dan's password manager
  ("Golf backups: age private key"). It's needed for a restore (docs/operations/restore-runbook.md).
  If the key pair is ever replaced, update this file. Backups made before then still need the
  old private key, so keep it until they've expired (30 days).
