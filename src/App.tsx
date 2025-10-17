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
    <>
      <style jsx global>{`
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-expand {
          animation: expand 0.3s ease-out;
        }
        @keyframes expand {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8 font-sans">
        <Toaster />
        <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 pt-12">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-800 mb-4 tracking-tight">
            arXiv Paper Summarizer
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Transform complex research papers into concise, readable summaries with AI
          </p>
        </div>

        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Enter arXiv Paper URL</CardTitle>
            <CardDescription className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Paste an arXiv URL to get a comprehensive AI-powered summary
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
              <Input
                type="url"
                placeholder="https://arxiv.org/abs/1234.56789"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12 text-base border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                disabled={loading}
              />
                <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 text-base font-medium min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full loading-spinner" />
                    Processing
                  </>
                ) : (
                  'Summarize Paper'
                )}
              </Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-6 rounded-xl border-red-200 bg-red-50/50">
                <AlertDescription className="text-red-700 font-medium text-base py-2">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {paperData && (
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden animate-expand">
            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 p-6 sm:p-8">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">{paperData.metadata.title}</CardTitle>
              <div className="text-sm text-slate-600 mb-3">
                <strong className="text-slate-700">Authors:</strong> {paperData.metadata.authors.join(', ')}
              </div>
              <div className="text-sm text-slate-600">
                <strong className="text-slate-700">Published:</strong> {new Date(paperData.metadata.published_date).toLocaleDateString(undefined, {
year: 'numeric',
month: 'long',
day: 'numeric'
})}
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-8">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 text-left hover:bg-slate-50 rounded-xl border border-slate-200 data-[state=open]:bg-slate-50">
                    <span className="font-semibold text-base text-slate-700">Original Abstract</span>
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ScrollArea className="h-48 w-full rounded-lg border border-slate-200 p-5 bg-white shadow-sm">
                    <p className="text-base leading-relaxed text-slate-700">{paperData.metadata.abstract}</p>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-slate-200" />

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">🤖 AI Summary</h3>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => copyToClipboard(paperData.summary)}
                    className="border-slate-300 hover:border-slate-400"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <ScrollArea className="h-64 w-full rounded-xl border border-slate-200 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 shadow-inner">
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