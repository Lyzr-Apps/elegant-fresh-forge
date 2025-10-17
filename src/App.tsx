import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Copy } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { callAIAgent } from '@/utils/aiAgent'
import parseLLMJson from '@/utils/jsonParser'

interface PaperMetadata {
  title: string
  authors: string[]
  abstract: string
  url: string
  published_date: string
}

interface SummaryResponse {
  success: boolean
  data: {
    metadata?: PaperMetadata
    summary?: string
    error?: string
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paperData, setPaperData] = useState<{
    metadata: PaperMetadata
    summary: string
  } | null>(null)

  const validateArxivUrl = (url: string): boolean => {
    const arxivRegex = /(?:https?:\/\/)?(?:www\.)?arxiv\.org\/(?:abs|pdf)\/(\d+(?:\.\d+)?(?:v\d+)?)/
    return arxivRegex.test(url)
  }

  const extractArxivId = (url: string): string => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?arxiv\.org\/(?:abs|pdf)\/(\d+(?:\.\d+)?(?:v\d+)?)/)
    return match ? match[1] : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPaperData(null)

    if (!url.trim()) {
      setError('Please enter an arXiv URL')
      return
    }

    if (!validateArxivUrl(url)) {
      setError('Please enter a valid arXiv URL (e.g., https://arxiv.org/abs/1234.56789)')
      return
    }

    setLoading(true)

    try {
      const arxivId = extractArxivId(url)
      const message = `Summarize this arXiv paper: ${arxivId}`

      const response = await callAIAgent(message, '68f24d4e811f17edf77d460e')
      const result = parseLLMJson<SummaryResponse>(response.response, { success: false, data: { error: 'Failed to parse response' } })

      if (result.success && result.data.metadata && result.data.summary) {
        setPaperData({
          metadata: result.data.metadata,
          summary: result.data.summary
        })
        toast.success('Paper summarized successfully')
      } else {
        setError(result.data.error || 'Failed to summarize paper')
      }
    } catch (err) {
      setError('An error occurred while processing the paper. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Summary copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes expand {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-expand { animation: expand 0.5s ease-out; }
      `}} />

      <Toaster />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 pt-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
            arXiv Paper Summarizer
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Transform complex research papers into concise summaries with AI
          </p>
        </div>

        <Card className="mb-6 shadow-xl border-0 bg-white/95 backdrop-blur rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-5">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Enter arXiv Paper URL</CardTitle>
            <CardDescription className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Paste an arXiv URL (e.g., https://arxiv.org/abs/1234.56789) and get an instant AI summary
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
              <Input
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-11 text-base"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto h-11 px-6 font-medium"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full loading-spinner"/>
                    Processing
                  </>
                ) : (
                  'Summarize'
                )}
              </Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-4 rounded-lg border-red-200">
                <AlertDescription className="text-red-700 text-sm py-2">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {paperData && (
          <Card className="shadow-lg border-0 animate-expand">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b p-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 mb-4 leading-tight">{paperData.metadata.title}</CardTitle>
              <div className="text-sm sm:text-base text-slate-600 flex flex-wrap gap-3 items-center">
                <span className="font-medium"><strong className="text-slate-800">Authors:</strong> {paperData.metadata.authors.join(', ')}</span>
                <Separator orientation="vertical" className="h-4 bg-slate-300" />
                <span className="font-medium"><strong className="text-slate-800">Published:</strong> {new Date(paperData.metadata.published_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-white hover:bg-slate-50">
                    <span className="font-medium">View Original Abstract</span>
                    <ChevronDown className="h-4 w-4 transition-transform">ChevronDown</ChevronDown>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <ScrollArea className="h-48 w-full rounded-lg border border-slate-200 p-4 bg-white">
                    <p className="text-base leading-relaxed text-slate-700">{paperData.metadata.abstract}</p>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">🤖 AI Summary</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paperData.summary)}
                    className="bg-white hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-56 w-full rounded-lg border border-slate-200 p-5 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
                  <p className="text-base leading-relaxed text-slate-800 font-medium">{paperData.summary}</p>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App