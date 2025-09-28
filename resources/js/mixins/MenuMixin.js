import { mapState, mapMutations } from 'vuex'

export default {
    data: {
        sessionRandomKey: Math.random().toString(36).substring(2, 15),
        baseSessionStorageKey: 'nova.collapsibleResourceManager.',
    },
    computed: {
        ...mapState([ 'mainMenuShown' ]),
        config() {
            return Nova.config('collapsible_resource_manager')
        },
        sessionStorageKey() {
            return this.baseSessionStorageKey + this.sessionRandomKey
        }
    },
    methods: {
        ...mapMutations([ 'toggleMainMenu' ]),
        restoreFromLocalStorage() {
            const storage = JSON.parse(sessionStorage.getItem(this.sessionStorageKey)) || {}
            this.clearSessionStorage()

            this.currentActiveMenu = storage.currentActiveMenu
            this.currentActiveSection = storage.currentActiveSection

            if (this.isDesktop) {
                this.$store.state.mainMenuShown = storage.mainMenuShown
            }
        },
        clearSessionStorage(prefix = this.baseSessionStorageKey) {
            // Remove only keys that start with the given prefix
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i)
                if (key && key.startsWith(prefix)) {
                    sessionStorage.removeItem(key)
                }
            }
        },
        saveToSessionStorage(overrides = {}) {
            const data = {
                currentActiveMenu: this.currentActiveMenu,
                currentActiveSection: this.currentActiveSection,
                mainMenuShown: this.$store.state.mainMenuShown,
                ...overrides,
            }

            sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(data))
        },
        collapseMenu() {
            this.currentActiveSection = this.findSectionByUrl(this.getCurrentUrl())
            if (this.currentActiveSection?.key !== this.currentActiveMenu?.key) {
                this.currentActiveMenu = null
            }
            this.$store.state.mainMenuShown = false
        },
        openMenu() {
            this.$store.state.mainMenuShown = true
        },
        onClickOutside() {
            if (this.config.auto_collapse_desktop_menu && this.currentActiveMenu && this.isDesktop) {
                this.collapseMenu()
            }
        },
        // --- Added helpers below ---
        getCurrentUrl() {
            try {
                return this.$page?.url || window.location.pathname + window.location.search
            } catch (e) {
                return window.location.pathname + window.location.search
            }
        },
        normalizePath(path) {
            if (!path) return ''

            // Drop query/hash
            const a = document.createElement('a')
            a.href = path
            let clean = (a.pathname || path)

            // Remove Nova base prefix (e.g., /nova)
            const base = Nova.config('base') || ''
            if (base && clean.startsWith(base)) {
                clean = clean.slice(base.length)
            }

            // Ensure leading slash and remove trailing slash (except root)
            if (!clean.startsWith('/')) clean = '/' + clean
            if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1)

            return clean
        },
        findSectionByPredicate(predicate) {
            const menus = this.$store.getters['mainMenu'] || []

            const walk = items => {
                if (!Array.isArray(items)) return false
                for (const it of items) {
                    if (!it) continue
                    // For concrete items, test predicate
                    if (predicate(it)) return true
                    if (Array.isArray(it.items) && walk(it.items)) return true
                }
                return false
            }

            for (const menu of menus) {
                if (!menu) continue
                // Check top-level menu itself
                if (predicate(menu)) return menu
                if (Array.isArray(menu.items) && walk(menu.items)) {
                    return menu
                }
            }

            return null
        },
        findSectionByItem(item) {
            if (!item) return null
            // Prefer matching by key if present
            const byKey = item.key ? this.findSectionByPredicate(child => child.key === item.key) : null
            if (byKey) return byKey

            // Fallback to path match
            if (item.path) {
                const normalized = this.normalizePath(item.path)
                return this.findSectionByPredicate(child => !!child.path && this.normalizePath(child.path) === normalized)
            }

            return null
        },
        findSectionByUrl(url) {
            const normalizedUrl = this.normalizePath(url)
            if (!normalizedUrl) return null

            // 1) Exact match first
            const exact = this.findSectionByPredicate(child => !!child.path && this.normalizePath(child.path) === normalizedUrl)
            if (exact) return exact

            // 2) Longest-prefix match across menus and their items
            const menus = this.$store.getters['mainMenu'] || []
            let best = { section: null, len: -1 }

            const consider = (node, section) => {
                if (!node?.path) return
                const p = this.normalizePath(node.path)
                if (p && (normalizedUrl === p || normalizedUrl.startsWith(p + '/'))) {
                    if (p.length > best.len) best = { section, len: p.length }
                }
            }

            for (const menu of menus) {
                if (!menu) continue
                consider(menu, menu)
                const queue = Array.isArray(menu.items) ? [ ...menu.items ] : []
                while (queue.length) {
                    const it = queue.shift()
                    consider(it, menu)
                    if (Array.isArray(it?.items)) queue.push(...it.items)
                }
            }

            return best.section
        },
    },
}
