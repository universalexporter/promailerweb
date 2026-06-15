// lib/download.ts
//
// One place that knows how to download the desktop app. Every "Download" button
// across the site calls handleDownloadApp() so behaviour stays consistent and is
// easy to update when the macOS build is ready.

export const WINDOWS_INSTALLER_URL =
  'https://ijhmrmubqexpvwmnhlrm.supabase.co/storage/v1/object/public/downloads/ProMailSuite-Setup.exe'

// Set this to a real URL once the Mac build is hosted; until then it stays null
// and Mac users get a friendly "coming soon" message instead of a broken file.
export const MAC_INSTALLER_URL: string | null = null

type OS = 'windows' | 'mac' | 'other'

export function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other'
  const ua = (navigator.userAgent || navigator.platform || '').toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'mac'
  return 'other'
}

function triggerDownload(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Call this from any button's onClick.
export function handleDownloadApp() {
  if (typeof window === 'undefined') return
  const os = detectOS()

  if (os === 'mac') {
    if (MAC_INSTALLER_URL) {
      triggerDownload(MAC_INSTALLER_URL)
    } else {
      alert(
        "The macOS version is coming soon!\n\n" +
        "Right now the desktop app is available for Windows only. " +
        "You can still sign in and manage everything from the web Client Portal on your Mac."
      )
    }
    return
  }

  // Windows (and any other desktop) → download the Windows installer.
  // On Windows this is exactly right; on Linux/other we still offer it since
  // there's no separate build yet.
  triggerDownload(WINDOWS_INSTALLER_URL)
}