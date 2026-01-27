import { v4 as uuidv4 } from "uuid"

export interface Document {
  id: string
  name: string
  type: string
  description: string
  date: string
  status: string
  userEmail: string
}

export function addDocument(document: Omit<Document, "id">): Document | null {
  try {
    const newDocument = {
      ...document,
      id: uuidv4(),
    }
    const documents = JSON.parse(localStorage.getItem("documents") || "[]")
    documents.push(newDocument)
    localStorage.setItem("documents", JSON.stringify(documents))

    // Add the document to the under review list
    const underReviewItems = JSON.parse(localStorage.getItem("underReviewItems") || "[]")
    underReviewItems.push({
      ...newDocument,
      type: "document",
    })
    localStorage.setItem("underReviewItems", JSON.stringify(underReviewItems))

    return newDocument
  } catch (error) {
    console.error("Error adding document:", error)
    return null
  }
}

export function getDocumentsByUser(userEmail: string): Document[] {
  const documents = JSON.parse(localStorage.getItem("documents") || "[]")
  return documents.filter((doc: Document) => doc.userEmail === userEmail)
}

export function deleteDocument(id: string): boolean {
  try {
    const documents = JSON.parse(localStorage.getItem("documents") || "[]")
    const updatedDocuments = documents.filter((doc: Document) => doc.id !== id)
    localStorage.setItem("documents", JSON.stringify(updatedDocuments))

    // Remove the document from the under review list
    const underReviewItems = JSON.parse(localStorage.getItem("underReviewItems") || "[]")
    const updatedUnderReviewItems = underReviewItems.filter((item: any) => item.id !== id)
    localStorage.setItem("underReviewItems", JSON.stringify(updatedUnderReviewItems))

    return true
  } catch (error) {
    console.error("Error deleting document:", error)
    return false
  }
}

