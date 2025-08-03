import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    // Add providers here when needed (e.g., theme provider, query client)
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }
