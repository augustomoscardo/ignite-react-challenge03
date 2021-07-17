import Link from "next/link";

import commonStyles from '../../styles/common.module.scss';

export function ExitPreviewButton() {
  return (
    <aside className={commonStyles.preview}>
      <Link href="/api/exit-preview">
        <a className={commonStyles.preview}>Sair do modo Preview</a>
      </Link>
    </aside>
  )
}