// Servicio para almacenar archivos localmente usando localStorage

export interface StoredFile {
  id: string
  name: string
  type: string
  size: number
  content: string // Base64 encoded content
  uploadDate: string
  category: string // Ej: "privacy-notice", "consent", "transfer-consent", etc.
  metadata: Record<string, any> // Metadatos adicionales como título, descripción, etc.
}

// Convertir un archivo a base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Guardar un archivo en localStorage
export const saveFile = async (
  file: File,
  metadata: Record<string, any> = {},
  category = "default",
): Promise<StoredFile> => {
  try {
    // Convertir archivo a base64
    const content = await fileToBase64(file)

    // Crear objeto de archivo almacenado
    const storedFile: StoredFile = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      uploadDate: new Date().toISOString(),
      category: category,
      metadata: metadata,
    }

    // Obtener archivos existentes
    const existingFiles: StoredFile[] = JSON.parse(localStorage.getItem("storedFiles") || "[]")

    // Añadir nuevo archivo
    existingFiles.push(storedFile)

    // Guardar en localStorage
    localStorage.setItem("storedFiles", JSON.stringify(existingFiles))

    return storedFile
  } catch (error) {
    console.error("Error al guardar el archivo:", error)
    throw error
  }
}

// Obtener todos los archivos
export const getAllFiles = (): StoredFile[] => {
  return JSON.parse(localStorage.getItem("storedFiles") || "[]")
}

// Obtener archivos por categoría
export const getFilesByCategory = (category: string): StoredFile[] => {
  const allFiles = getAllFiles()
  return allFiles.filter((file) => file.category === category)
}

// Obtener un archivo por ID
export const getFileById = (id: string): StoredFile | undefined => {
  const allFiles = getAllFiles()
  return allFiles.find((file) => file.id === id)
}

// Eliminar un archivo
export const deleteFile = (id: string): boolean => {
  try {
    const allFiles = getAllFiles()
    const updatedFiles = allFiles.filter((file) => file.id !== id)
    localStorage.setItem("storedFiles", JSON.stringify(updatedFiles))
    return true
  } catch (error) {
    console.error("Error al eliminar el archivo:", error)
    return false
  }
}

// Actualizar metadatos de un archivo
export const updateFileMetadata = (id: string, metadata: Record<string, any>): boolean => {
  try {
    const allFiles = getAllFiles()
    const fileIndex = allFiles.findIndex((file) => file.id === id)

    if (fileIndex === -1) {
      console.error("Archivo no encontrado:", id)
      return false
    }

    // Crear una copia profunda del archivo
    const updatedFile = JSON.parse(JSON.stringify(allFiles[fileIndex]))

    // Actualizar los metadatos
    updatedFile.metadata = {
      ...updatedFile.metadata,
      ...metadata,
    }

    // Actualizar el array de archivos
    allFiles[fileIndex] = updatedFile

    // Guardar en localStorage
    localStorage.setItem("storedFiles", JSON.stringify(allFiles))

    // Disparar evento de storage para actualizar otras partes de la aplicación
    window.dispatchEvent(new Event("storage"))

    return true
  } catch (error) {
    console.error("Error al actualizar metadatos del archivo:", error)
    return false
  }
}

// Actualizar el contenido de un archivo existente
export const updateFile = async (
  id: string,
  file: File,
  metadata: Record<string, any> = {},
): Promise<boolean> => {
  try {
    const allFiles = getAllFiles()
    const fileIndex = allFiles.findIndex((f) => f.id === id)

    if (fileIndex === -1) {
      console.error("Archivo no encontrado:", id)
      return false
    }

    const content = await fileToBase64(file)

    const updatedFile: StoredFile = {
      ...allFiles[fileIndex],
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      metadata: {
        ...allFiles[fileIndex].metadata,
        ...metadata,
      },
    }

    allFiles[fileIndex] = updatedFile
    localStorage.setItem("storedFiles", JSON.stringify(allFiles))
    window.dispatchEvent(new Event("storage"))
    return true
  } catch (error) {
    console.error("Error al actualizar el archivo:", error)
    return false
  }
}

// Crear una URL para visualizar el archivo
export const createFileURL = (fileContent: string): string => {
  return fileContent
}

export const fileStorage = {
  fileToBase64,
  saveFile,
  getAllFiles,
  getFilesByCategory,
  getFileById,
  deleteFile,
  updateFile,
  updateFileMetadata,
  createFileURL,
}

