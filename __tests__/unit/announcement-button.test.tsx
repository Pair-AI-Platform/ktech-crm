import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnnouncementButton } from '@/components/layout/announcement-button'

describe('AnnouncementButton', () => {
  it('keeps hook order stable when admin access changes', () => {
    const { rerender } = render(<AnnouncementButton isAdmin={false} />)

    expect(screen.queryByTitle('Send Announcement')).not.toBeInTheDocument()

    expect(() => {
      rerender(<AnnouncementButton isAdmin />)
    }).not.toThrow()

    expect(screen.getByTitle('Send Announcement')).toBeInTheDocument()
  })
})
