import { render, screen } from '@testing-library/react'
import { LoadingSpinner, PulseLoader, ProgressLoader, LoadingButton } from '../loading-spinner'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>
  }
}))

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />)

    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />)

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" text="Loading data..." />)

    const container = screen.getByText('Loading data...').closest('div')
    expect(container).toHaveClass('custom-class')
  })
})

describe('PulseLoader', () => {
  it('renders three pulse dots', () => {
    render(<PulseLoader />)

    const container = document.querySelector('.flex.space-x-1')
    expect(container?.children).toHaveLength(3)
  })
})

describe('ProgressLoader', () => {
  it('renders with progress value', () => {
    render(<ProgressLoader progress={50} />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows percentage when enabled', () => {
    render(<ProgressLoader progress={75} showPercentage />)
    
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('updates progress bar width', () => {
    render(<ProgressLoader progress={60} />)

    // The progress bar should have width style set
    const progressBar = document.querySelector('.bg-primary.h-2.rounded-full')
    expect(progressBar).toBeInTheDocument()
  })
})

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingButton isLoading={false}>
        Click me
      </LoadingButton>
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading spinner when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )

    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when explicitly disabled', () => {
    render(
      <LoadingButton isLoading={false} disabled={true}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <LoadingButton isLoading={false} className="custom-button">
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-button')
  })
})
