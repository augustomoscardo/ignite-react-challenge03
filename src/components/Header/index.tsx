import Link from 'next/link'

import styles from './header.module.scss'
import commonStyles from '../../styles/common.module.scss';

export function Header() {
  
  return (
    <header className={commonStyles.container}>
      <div className={styles.headerContent}>
        <Link href="/">
          <a>
            <img src="/images/logo.svg" alt="logo" />
          </a>
        </Link>
      </div>
    </header>
  )
}
