import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder,
  Plus,
  Trash2,
  FolderPlus,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Input } from './ui/input'

export interface FileSystemNode {
  name: string
  isDirectory: boolean
  path?: string
  children?: FileSystemNode[]
}

interface FileTreeProps {
  files: FileSystemNode[]
  onSelectFile: (path: string) => void
  onCreateFile?: (path: string, isDirectory: boolean) => void
  onDeleteFile?: (path: string) => void
}

export function FileTree({ files, onSelectFile, onCreateFile, onDeleteFile }: FileTreeProps) {
  const [newFileName, setNewFileName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')

  const handleCreateFile = () => {
    if (newFileName.trim() && onCreateFile) {
      onCreateFile(newFileName.trim(), createType === 'folder')
      setNewFileName('')
      setIsCreateDialogOpen(false)
    }
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Files</span>
        <div className="flex gap-1">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New {createType === 'file' ? 'File' : 'Folder'}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={createType === 'file' ? 'filename.ts' : 'folder-name'}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFile()
                    }
                  }}
                />
                <Button onClick={handleCreateFile}>Create</Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={createType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateType('file')}
                >
                  <FileIcon className="h-3 w-3 mr-1" />
                  File
                </Button>
                <Button
                  variant={createType === 'folder' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreateType('folder')}
                >
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Folder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {Array.isArray(files) && files.map(file => (
        <FileTreeNode
          key={file.name}
          node={file}
          onSelectFile={onSelectFile}
          onDeleteFile={onDeleteFile}
        />
      ))}
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileSystemNode
  onSelectFile: (path: string) => void
  onDeleteFile?: (path: string) => void
  level?: number
}

function FileTreeNode({
  node,
  onSelectFile,
  onDeleteFile,
  level = 0,
  path = '',
}: FileTreeNodeProps & { path?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const isDirectory = node.isDirectory
  const hasChildren = node.children && node.children.length > 0
  const newPath = `${path}/${node.name}`

  const handleToggle = () => {
    if (isDirectory) {
      setIsOpen(!isOpen)
    } else {
      onSelectFile(newPath)
    }
  }

  const handleDelete = () => {
    if (onDeleteFile) {
      onDeleteFile(newPath)
    }
  }

  return (
    <div>
      <div
        className="flex items-center cursor-pointer hover:bg-muted/50 rounded-sm p-1 group"
        style={{ paddingLeft: level * 16 + 4 }}
        onClick={handleToggle}
      >
        {isDirectory ? (
          <>
            {isOpen ? (
              <ChevronDown size={16} className="mr-1 text-muted-foreground" />
            ) : (
              <ChevronRight size={16} className="mr-1 text-muted-foreground" />
            )}
            <Folder size={16} className="mr-2 text-blue-500" />
          </>
        ) : (
          <FileIcon size={16} className="mr-2 ml-4 text-muted-foreground" />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        {onDeleteFile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 opacity-0 group-hover:opacity-100 ml-1"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        )}
      </div>
      {isOpen &&
        hasChildren &&
        node.children?.map(child => (
          <FileTreeNode
            key={child.name}
            node={child}
            onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile}
            level={level + 1}
            path={newPath}
          />
        ))}
    </div>
  )
}
