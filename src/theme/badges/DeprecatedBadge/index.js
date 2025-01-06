import React from "react"
import styles from "./styles.module.css"

const Icon = () => {
    return (
        <div className={styles.deprecatedIcon} style={{marginRight: '8px', marginTop: '4px'}}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 0H1C0.734784 0 0.48043 0.105357 0.292893 0.292893C0.105357 0.48043 0 0.734784 0 1V2.5C0 2.76522 0.105357 3.01957 0.292893 3.20711C0.48043 3.39464 0.734784 3.5 1 3.5V9C1 9.26522 1.10536 9.51957 1.29289 9.70711C1.48043 9.89464 1.73478 10 2 10H12C12.2652 10 12.5196 9.89464 12.7071 9.70711C12.8946 9.51957 13 9.26522 13 9V3.5C13.2652 3.5 13.5196 3.39464 13.7071 3.20711C13.8946 3.01957 14 2.76522 14 2.5V1C14 0.734784 13.8946 0.48043 13.7071 0.292893C13.5196 0.105357 13.2652 0 13 0ZM12 9H2V3.5H12V9ZM13 2.5H1V1H13V2.5ZM5 5.5C5 5.36739 5.05268 5.24021 5.14645 5.14645C5.24021 5.05268 5.36739 5 5.5 5H8.5C8.63261 5 8.75979 5.05268 8.85355 5.14645C8.94732 5.24021 9 5.36739 9 5.5C9 5.63261 8.94732 5.75979 8.85355 5.85355C8.75979 5.94732 8.63261 6 8.5 6H5.5C5.36739 6 5.24021 5.94732 5.14645 5.85355C5.05268 5.75979 5 5.63261 5 5.5Z" fill="#53575F"/>
            </svg>
        </div>
    )
}

const DeprecatedBadge = () => {
    return (
        <div className={styles.deprecatedBadge}>
            <Icon />Deprecated feature
        </div>
    )
}

export default DeprecatedBadge
