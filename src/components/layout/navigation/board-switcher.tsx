'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

// Mock data - will be replaced with real data from API
const mockBoards = [
  { id: '1', name: 'Project Alpha', lastModified: '2 hours ago' },
  { id: '2', name: 'Marketing Campaign', lastModified: '1 day ago' },
  { id: '3', name: 'Bug Fixes', lastModified: '3 days ago' },
]

export function BoardSwitcher() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentBoard, setCurrentBoard] = useState(mockBoards[0])

  const filteredBoards = mockBoards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 px-3">
          <span className="font-medium">{currentBoard.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Switch Board</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Recent Boards */}
        <DropdownMenuLabel>Recent Boards</DropdownMenuLabel>
        {filteredBoards.length > 0 ? (
          filteredBoards.map((board) => (
            <DropdownMenuItem
              key={board.id}
              onClick={() => setCurrentBoard(board)}
              className="flex flex-col items-start space-y-1 p-3"
            >
              <span className="font-medium">{board.name}</span>
              <span className="text-xs text-muted-foreground">
                Last modified {board.lastModified}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            No boards found
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Create New Board */}
        <DropdownMenuItem className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create new board</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
