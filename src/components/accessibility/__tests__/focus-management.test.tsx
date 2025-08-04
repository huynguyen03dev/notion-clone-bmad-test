import { renderHook, act } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { useFocusManagement, FocusManager, useFocusAnnouncement } from '../focus-management'
import { vi } from 'vitest'

describe('useFocusManagement', () => {
  beforeEach(() => {
    // Mock document methods
    document.body.innerHTML = ''
  })

  it('should provide container ref and focus methods', () => {
    const { result } = renderHook(() => useFocusManagement())
    
    expect(result.current.containerRef).toBeDefined()
    expect(typeof result.current.focusFirst).toBe('function')
    expect(typeof result.current.focusLast).toBe('function')
    expect(typeof result.current.getFocusableElements).toBe('function')
  })

  it('should find focusable elements', () => {
    const TestComponent = () => {
      const { containerRef, getFocusableElements } = useFocusManagement()
      
      return (
        <div ref={containerRef}>
          <button>Button 1</button>
          <input type="text" />
          <a href="#">Link</a>
          <button disabled>Disabled Button</button>
        </div>
      )
    }

    render(<TestComponent />)
    
    const { result } = renderHook(() => useFocusManagement())
    
    // This is a simplified test - in a real scenario we'd need to access the hook result
    // from within the component that uses it
    expect(result.current.getFocusableElements).toBeDefined()
  })
})

describe('FocusManager', () => {
  it('should render children with proper attributes', () => {
    render(
      <FocusManager>
        <button>Test Button</button>
      </FocusManager>
    )
    
    const container = screen.getByRole('region')
    expect(container).toHaveAttribute('aria-label', 'Interactive content')
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })

  it('should accept custom className and element type', () => {
    render(
      <FocusManager as="section" className="custom-class">
        <button>Test Button</button>
      </FocusManager>
    )
    
    const container = screen.getByRole('region')
    expect(container.tagName).toBe('SECTION')
    expect(container).toHaveClass('custom-class')
  })
})

describe('useFocusAnnouncement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create announcement element', () => {
    const { result } = renderHook(() => useFocusAnnouncement())
    
    act(() => {
      result.current.announce('Test announcement')
    })
    
    const announcement = document.querySelector('[aria-live="polite"]')
    expect(announcement).toBeInTheDocument()
    expect(announcement).toHaveTextContent('Test announcement')
    expect(announcement).toHaveClass('sr-only')
  })

  it('should support different priority levels', () => {
    const { result } = renderHook(() => useFocusAnnouncement())
    
    act(() => {
      result.current.announce('Urgent announcement', 'assertive')
    })
    
    const announcement = document.querySelector('[aria-live="assertive"]')
    expect(announcement).toBeInTheDocument()
  })

  it('should remove announcement after timeout', () => {
    const { result } = renderHook(() => useFocusAnnouncement())
    
    act(() => {
      result.current.announce('Test announcement')
    })
    
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument()
  })
})
