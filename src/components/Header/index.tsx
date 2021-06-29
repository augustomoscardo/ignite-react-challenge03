
import Link from 'next/link'
import styles from './header.module.scss'

export function Header() {
  
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/">
          <a>
            <img src="/images/logo.svg" alt="Logo spacetraveling" />
          </a>
        </Link>
      </div>
    </header>
  )
}
