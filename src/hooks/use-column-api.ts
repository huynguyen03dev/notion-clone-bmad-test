import { useState } from 'react'
import { toast } from 'sonner'

interface Column {
  id: string
  name: string
  color?: string | null
  position: number
  _count: {
    tasks: number
  }
}

interface CreateColumnData {
  name: string
  boardId: string
  color?: string
}

interface UpdateColumnData {
  name?: string
  color?: string | null
  position?: number
}

interface DeleteColumnData {
  taskAction: 'move' | 'delete'
  targetColumnId?: string
}

export function useColumnApi() {
  const [isLoading, setIsLoading] = useState(false)

  const createColumn = async (
    data: CreateColumnData
  ): Promise<Column | null> => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create column')
      }

      const result = await response.json()
      toast.success('Column created successfully')
      return result.column
    } catch (error) {
      console.error('Error creating column:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create column'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateColumn = async (
    columnId: string,
    data: UpdateColumnData
  ): Promise<Column | null> => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error(
            'Column position conflict. Please refresh and try again.'
          )
        }
        throw new Error(errorData.error || 'Failed to update column')
      }

      const result = await response.json()

      // Only show success toast for user-initiated updates (not position updates)
      if (data.name || data.color !== undefined) {
        toast.success('Column updated successfully')
      }

      return result.column
    } catch (error) {
      console.error('Error updating column:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update column'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteColumn = async (
    columnId: string,
    data: DeleteColumnData
  ): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete column')
      }

      toast.success('Column deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting column:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete column'
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createColumn,
    updateColumn,
    deleteColumn,
    isLoading,
  }
}
