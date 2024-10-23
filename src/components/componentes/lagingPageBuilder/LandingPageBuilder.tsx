'use client'

import { useState } from 'react'
import { Plus, Settings, X, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type ComponentType = 'paragraph' | 'button' | 'image' | 'video' | 'carousel' | 'form'

interface Component {
  type: ComponentType
  props: any
}

interface ContainerConfig {
  backgroundColor: string
  alignment: 'flex-col' | 'flex-row'
}

interface Container {
  components: Component[]
  config: ContainerConfig
}

interface HeaderConfig {
  logo: string
  navItems: string[]
}

export default function LandingPageBuilder() {
  const [containers, setContainers] = useState<Container[]>([])
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    logo: '/placeholder.svg?height=50&width=100',
    navItems: ['Home', 'About', 'Contact']
  })
  const [showPreview, setShowPreview] = useState(false)

  const addContainer = () => {
    setContainers([...containers, {
      components: [],
      config: {
        backgroundColor: 'bg-white',
        alignment: 'flex-col'
      }
    }])
  }

  const addComponent = (containerIndex: number, type: ComponentType) => {
    if (containers[containerIndex].components.length < 4) {
      const newContainers = [...containers]
      newContainers[containerIndex].components.push({ type, props: getDefaultProps(type) })
      setContainers(newContainers)
    }
  }

  const updateComponent = (containerIndex: number, componentIndex: number, newProps: any) => {
    const newContainers = [...containers]
    newContainers[containerIndex].components[componentIndex].props = {
      ...newContainers[containerIndex].components[componentIndex].props,
      ...newProps
    }
    setContainers(newContainers)
  }

  const removeComponent = (containerIndex: number, componentIndex: number) => {
    const newContainers = [...containers]
    newContainers[containerIndex].components.splice(componentIndex, 1)
    setContainers(newContainers)
  }

  const updateContainerConfig = (containerIndex: number, newConfig: Partial<ContainerConfig>) => {
    const newContainers = [...containers]
    newContainers[containerIndex].config = {
      ...newContainers[containerIndex].config,
      ...newConfig
    }
    setContainers(newContainers)
  }

  const getDefaultProps = (type: ComponentType) => {
    switch (type) {
      case 'paragraph':
        return { content: 'Enter your text here', font: 'font-sans', fontSize: 16, alignment: 'text-left', bold: false, italic: false, underline: false }
      case 'button':
        return { text: 'Click me', link: '#', font: 'font-sans', fontSize: 16, alignment: 'text-center', bold: false, italic: false, underline: false }
      case 'image':
        return { src: '/placeholder.svg?height=200&width=300', alt: 'Placeholder image', width: 300, height: 200, opacity: 100 }
      case 'video':
        return { src: 'https://example.com/video.mp4', width: 640, height: 360, autoplay: false, muted: false, defaultSize: true }
      case 'carousel':
        return { items: [{ image: '/placeholder.svg?height=200&width=300', text: '', link: '', buttonText: '' }], slideCount: 1, showText: false, showLinks: false, showButtons: false, isCardType: false }
      case 'form':
        return { title: 'Contact Us', subtitle: 'Fill out the form below', font: 'font-sans', fontSize: 16, alignment: 'text-left', fields: [{ label: 'Email', type: 'email' }] }
      default:
        return {}
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header config={headerConfig} onConfigUpdate={setHeaderConfig} />
      <main className="flex-grow p-4">
        {containers.map((container, containerIndex) => (
          <div key={containerIndex} className={`mb-8 p-4 border border-dashed border-gray-300 rounded-lg ${container.config.backgroundColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Container {containerIndex + 1}</h2>
              <div className="flex space-x-2">
                <ContainerConfigDialog
                  config={container.config}
                  onUpdate={(newConfig) => updateContainerConfig(containerIndex, newConfig)}
                />
                <AddComponentButton
                  onAddComponent={(type) => addComponent(containerIndex, type)}
                  disabled={container.components.length >= 4}
                />
              </div>
            </div>
            <div className={`flex ${container.config.alignment} gap-4`}>
              {container.components.map((component, componentIndex) => (
                <div key={componentIndex} className="relative w-full">
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => removeComponent(containerIndex, componentIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <ComponentRenderer
                    component={component}
                    onUpdate={(newProps) => updateComponent(containerIndex, componentIndex, newProps)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
      <Footer />
      <div className="fixed bottom-4 right-4 flex space-x-2">
        <Button
          onClick={() => setShowPreview(true)}
          className="rounded-full w-12 h-12 p-0"
        >
          <Eye className="w-6 h-6" />
          <span className="sr-only">Preview</span>
        </Button>
        <Button
          onClick={addContainer}
          className="rounded-full w-12 h-12 p-0"
        >
          <Plus className="w-6 h-6" />
          <span className="sr-only">Add container</span>
        </Button>
      </div>
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Landing Page Preview</DialogTitle>
            </DialogHeader>
            <LandingPagePreview headerConfig={headerConfig} containers={containers} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function Header({ config, onConfigUpdate }: { config: HeaderConfig; onConfigUpdate: (newConfig: HeaderConfig) => void }) {
  return (
    <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
      <img src={config.logo} alt="Logo" className="h-8" />
      <nav>
        {config.navItems.map((item, index) => (
          <Button key={index} variant="ghost" className="mx-1">{item}</Button>
        ))}
      </nav>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Header settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={config.logo}
                onChange={(e) => onConfigUpdate({ ...config, logo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="navItems">Navigation Items (comma-separated)</Label>
              <Input
                id="navItems"
                value={config.navItems.join(',')}
                onChange={(e) => onConfigUpdate({ ...config, navItems: e.target.value.split(',') })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground p-4 text-center">
      <p>&copy; 2024 Your Company. All rights reserved.</p>
    </footer>
  )
}

function ContainerConfigDialog({ config, onUpdate }: { config: ContainerConfig; onUpdate: (newConfig: Partial<ContainerConfig>) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Config
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Container Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <Select
              onValueChange={(value) => onUpdate({ backgroundColor: value })}
              defaultValue={config.backgroundColor}
            >
              <SelectTrigger id="backgroundColor">
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bg-white">White</SelectItem>
                <SelectItem value="bg-gray-100">Light Gray</SelectItem>
                <SelectItem value="bg-blue-100">Light Blue</SelectItem>
                <SelectItem value="bg-green-100">Light Green</SelectItem>
                <SelectItem value="bg-red-100">Light Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="alignment">Alignment</Label>
            <Select
              onValueChange={(value) => onUpdate({ alignment: value as 'flex-col' | 'flex-row' })}
              defaultValue={config.alignment}
            >
              <SelectTrigger id="alignment">
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flex-col">Vertical</SelectItem>
                <SelectItem value="flex-row">Horizontal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddComponentButton({ onAddComponent, disabled }: { onAddComponent: (type: ComponentType) => void; disabled: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Add Component</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {(['paragraph', 'button', 'image', 'video', 'carousel', 'form'] as ComponentType[]).map((type) => (
            <Button key={type} onClick={() => onAddComponent(type)} className="h-20 text-lg capitalize">
              {type}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ComponentRenderer({ component, onUpdate }: { component: Component; onUpdate: (newProps: any) => void }) {
  switch (component.type) {
    case 'paragraph':
      return <ParagraphComponent {...component.props} onUpdate={onUpdate} />
    case 'button':
      return <ButtonComponent {...component.props} onUpdate={onUpdate} />
    case 'image':
      return <ImageComponent {...component.props} onUpdate={onUpdate} />
    case 'video':
      return <VideoComponent {...component.props} onUpdate={onUpdate} />
    case 'carousel':
      return <CarouselComponent {...component.props} onUpdate={onUpdate} />
    case 'form':
      return <FormComponent {...component.props} onUpdate={onUpdate} />
    default:
      return null
  }
}

function ParagraphComponent({ content, font, fontSize, alignment, bold, italic, underline, onUpdate }: { content: string; font: string; fontSize: number; alignment: string; bold: boolean; italic: boolean; underline: boolean; onUpdate: (newProps: any) => void }) {
  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="w-full mb-2"
      />
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={(value) => onUpdate({ font: value })} value={font}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="font-sans">Sans-serif</SelectItem>
            <SelectItem value="font-serif">Serif</SelectItem>
            <SelectItem value="font-mono">Monospace</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Font size"
        />
        <Select onValueChange={(value) => onUpdate({ alignment: value })} value={alignment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-left">Left</SelectItem>
            <SelectItem value="text-center">Center</SelectItem>
            <SelectItem value="text-right">Right</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex  items-center space-x-2">
          <Switch
            checked={bold}
            onCheckedChange={(checked: any) => onUpdate({ bold: checked })}
            id="bold"
          />
          <Label htmlFor="bold">Bold</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={italic}
            onCheckedChange={(checked: any) => onUpdate({ italic: checked })}
            id="italic"
          />
          <Label htmlFor="italic">Italic</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={underline}
            onCheckedChange={(checked: any) => onUpdate({ underline: checked })}
            id="underline"
          />
          <Label htmlFor="underline">Underline</Label>
        </div>
      </div>
    </div>
  )
}

function ButtonComponent({ text, link, font, fontSize, alignment, bold, italic, underline, onUpdate }: { text: string; link: string; font: string; fontSize: number; alignment: string; bold: boolean; italic: boolean; underline: boolean; onUpdate: (newProps: any) => void }) {
  return (
    <div className="space-y-2">
      <Input
        value={text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Button text"
        className="mb-2"
      />
      <Input
        value={link}
        onChange={(e) => onUpdate({ link: e.target.value })}
        placeholder="Button link"
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={(value) => onUpdate({ font: value })} value={font}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="font-sans">Sans-serif</SelectItem>
            <SelectItem value="font-serif">Serif</SelectItem>
            <SelectItem value="font-mono">Monospace</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Font size"
        />
        <Select onValueChange={(value) => onUpdate({ alignment: value })} value={alignment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-left">Left</SelectItem>
            <SelectItem value="text-center">Center</SelectItem>
            <SelectItem value="text-right">Right</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            checked={bold}
            onCheckedChange={(checked: any) => onUpdate({ bold: checked })}
            id="bold"
          />
          <Label htmlFor="bold">Bold</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={italic}
            onCheckedChange={(checked: any) => onUpdate({ italic: checked })}
            id="italic"
          />
          <Label htmlFor="italic">Italic</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={underline}
            onCheckedChange={(checked: any) => onUpdate({ underline: checked })}
            id="underline"
          />
          <Label htmlFor="underline">Underline</Label>
        </div>
      </div>
      <Button className={`${font} text-${fontSize} ${alignment} ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}>
        {text}
      </Button>
    </div>
  )
}

function ImageComponent({ src, alt, width, height, opacity, onUpdate }: { src: string; alt: string; width: number; height: number; opacity: number; onUpdate: (newProps: any) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onUpdate({ src: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-2">
      <img src={src} alt={alt} className="max-w-full h-auto mb-2" style={{ width, height, opacity: opacity / 100 }} />
      <Input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="mb-2"
      />
      <Input
        value={src}
        onChange={(e) => onUpdate({ src: e.target.value })}
        placeholder="Image URL"
        className="mb-2"
      />
      <Input
        value={alt}
        onChange={(e) => onUpdate({ alt: e.target.value })}
        placeholder="Alt text"
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        <Input
          type="number"
          value={width}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Width"
        />
        <Input
          type="number"
          value={height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Height"
        />
        <div className="flex items-center space-x-2">
          <Label htmlFor="opacity">Opacity</Label>
          <Slider
            id="opacity"
            min={0}
            max={100}
            step={1}
            value={[opacity]}
            onValueChange={([value]) => onUpdate({ opacity: value })}
            className="w-[100px]"
          />
          <span>{opacity}%</span>
        </div>
      </div>
    </div>
  )
}

function VideoComponent({ src, width, height, autoplay, muted, defaultSize, onUpdate }: { src: string; width: number; height: number; autoplay: boolean; muted: boolean; defaultSize: boolean; onUpdate: (newProps: any) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onUpdate({ src: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-2">
      <video
        controls
        className="w-full mb-2"
        src={src}
        autoPlay={autoplay}
        muted={muted}
        style={defaultSize ? {} : { width, height }}
      >
        Your browser does not support the video tag.
      </video>
      <Input
        type="file"
        onChange={handleFileChange}
        accept="video/*"
        className="mb-2"
      />
      <Input
        value={src}
        onChange={(e) => onUpdate({ src: e.target.value })}
        placeholder="Video URL"
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        <Input
          type="number"
          value={width}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Width"
          disabled={defaultSize}
        />
        <Input
          type="number"
          value={height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Height"
          disabled={defaultSize}
        />
        <div className="flex items-center space-x-2">
          <Switch
            checked={autoplay}
            onCheckedChange={(checked: any) => onUpdate({ autoplay: checked })}
            id="autoplay"
          />
          <Label htmlFor="autoplay">Autoplay</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={muted}
            onCheckedChange={(checked: any) => onUpdate({ muted: checked })}
            id="muted"
          />
          <Label htmlFor="muted">Muted</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={defaultSize}
            onCheckedChange={(checked: any) => onUpdate({ defaultSize: checked })}
            id="defaultSize"
          />
          <Label htmlFor="defaultSize">Default Size</Label>
        </div>
      </div>
    </div>
  )
}

function CarouselComponent({ items, slideCount, showText, showLinks, showButtons, isCardType, onUpdate }: { items: any[]; slideCount: number; showText: boolean; showLinks: boolean; showButtons: boolean; isCardType: boolean; onUpdate: (newProps: any) => void }) {
  const addSlide = () => {
    const newItems = [...items, { image: '/placeholder.svg?height=200&width=300', text: '', link: '', buttonText: '' }]
    onUpdate({ items: newItems, slideCount: Math.min(newItems.length, slideCount + 1) })
  }

  const updateSlide = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate({ items: newItems })
  }

  const removeSlide = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems, slideCount: Math.min(newItems.length, slideCount) })
  }

  return (
    <div className="space-y-4">
      <Carousel className="w-full max-w-xs mx-auto">
        <CarouselContent>
          {items.slice(0, slideCount).map((item, index) => (
            <CarouselItem key={index}>
              {isCardType ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{item.text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img src={item.image} alt={`Slide ${index + 1}`} className="w-full h-auto" />
                  </CardContent>
                  {showLinks && (
                    <CardFooter>
                      <a href={item.link} className="text-blue-500 hover:underline">{item.link}</a>
                    </CardFooter>
                  )}
                  {showButtons && (
                    <CardFooter>
                      <Button>{item.buttonText}</Button>
                    </CardFooter>
                  )}
                </Card>
              ) : (
                <div className="relative">
                  <img src={item.image} alt={`Slide ${index + 1}`} className="w-full h-auto" />
                  {showText && <p className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2">{item.text}</p>}
                  {showLinks && <a href={item.link} className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded">Link</a>}
                  {showButtons && <Button className="absolute bottom-4 right-4">{item.buttonText}</Button>}
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={item.image}
              onChange={(e) => updateSlide(index, 'image', e.target.value)}
              placeholder={`Image URL ${index + 1}`}
            />
            {showText && (
              <Input
                value={item.text}
                onChange={(e) => updateSlide(index, 'text', e.target.value)}
                placeholder="Text"
              />
            )}
            {showLinks && (
              <Input
                value={item.link}
                onChange={(e) => updateSlide(index, 'link', e.target.value)}
                placeholder="Link"
              />
            )}
            {showButtons && (
              <Input
                value={item.buttonText}
                onChange={(e) => updateSlide(index, 'buttonText', e.target.value)}
                placeholder="Button Text"
              />
            )}
            <Button variant="outline" size="icon" onClick={() => removeSlide(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button onClick={addSlide}>Add Slide</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          type="number"
          value={slideCount}
          onChange={(e) => onUpdate({ slideCount: Math.min(parseInt(e.target.value), items.length) })}
          className="w-20"
          placeholder="Slide Count"
        />
        <div className="flex items-center space-x-2">
          <Switch
            checked={showText}
            onCheckedChange={(checked: any) => onUpdate({ showText: checked })}
            id="showText"
          />
          <Label htmlFor="showText">Show Text</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={showLinks}
            onCheckedChange={(checked: any) => onUpdate({ showLinks: checked })}
            id="showLinks"
          />
          <Label htmlFor="showLinks">Show Links</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={showButtons}
            onCheckedChange={(checked: any) => onUpdate({ showButtons: checked })}
            id="showButtons"
          />
          <Label htmlFor="showButtons">Show Buttons</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={isCardType}
            onCheckedChange={(checked: any) => onUpdate({ isCardType: checked })}
            id="isCardType"
          />
          <Label htmlFor="isCardType">Card Type</Label>
        </div>
      </div>
    </div>
  )
}

function FormComponent({ title, subtitle, font, fontSize, alignment, fields, onUpdate }: { title: string; subtitle: string; font: string; fontSize: number; alignment: string; fields: { label: string; type: string }[]; onUpdate: (newProps: any) => void }) {
  const addField = () => {
    onUpdate({ fields: [...fields, { label: 'New Field', type: 'text' }] })
  }

  return (
    <div className="space-y-4">
      <Input
        value={title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Form Title"
        className="mb-2"
      />
      <Input
        value={subtitle}
        onChange={(e) => onUpdate({ subtitle: e.target.value })}
        placeholder="Form Subtitle"
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={(value) => onUpdate({ font: value })} value={font}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="font-sans">Sans-serif</SelectItem>
            <SelectItem value="font-serif">Serif</SelectItem>
            <SelectItem value="font-mono">Monospace</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-20"
          placeholder="Font size"
        />
        <Select onValueChange={(value) => onUpdate({ alignment: value })} value={alignment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-left">Left</SelectItem>
            <SelectItem value="text-center">Center</SelectItem>
            <SelectItem value="text-right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={field.label}
              onChange={(e) => {
                const newFields = [...fields]
                newFields[index] = { ...newFields[index], label: e.target.value }
                onUpdate({ fields: newFields })
              }}
              placeholder="Field label"
            />
            <Select
              onValueChange={(value) => {
                const newFields = [...fields]
                newFields[index] = { ...newFields[index], type: value }
                onUpdate({ fields: newFields })
              }}
              value={field.type}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => {
              const newFields = fields.filter((_, i) => i !== index)
              onUpdate({ fields: newFields })
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addField}>Add Field</Button>
    </div>
  )
}

function LandingPagePreview({ headerConfig, containers }: { headerConfig: HeaderConfig; containers: Container[] }) {
  return (
    <div className="space-y-8">
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <img src={headerConfig.logo} alt="Logo" className="h-8" />
        <nav>
          {headerConfig.navItems.map((item, index) => (
            <Button key={index} variant="ghost" className="mx-1">{item}</Button>
          ))}
        </nav>
      </header>
      {containers.map((container, containerIndex) => (
        <div key={containerIndex} className={`p-4 ${container.config.backgroundColor}`}>
          <div className={`flex ${container.config.alignment} gap-4`}>
            {container.components.map((component, componentIndex) => (
              <div key={componentIndex} className="w-full">
                <PreviewComponent component={component} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <footer className="bg-primary text-primary-foreground p-4 text-center">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </footer>
    </div>
  )
}

function PreviewComponent({ component }: { component: Component }) {
  switch (component.type) {
    case 'paragraph':
      return <PreviewParagraph {...component.props} />
    case 'button':
      return <PreviewButton {...component.props} />
    case 'image':
      return <PreviewImage {...component.props} />
    case 'video':
      return <PreviewVideo {...component.props} />
    case 'carousel':
      return <PreviewCarousel {...component.props} />
    case 'form':
      return <PreviewForm {...component.props} />
    default:
      return null
  }
}

function PreviewParagraph({ content, font, fontSize, alignment, bold, italic, underline }: { content: string; font: string; fontSize: number; alignment: string; bold: boolean; italic: boolean; underline: boolean }) {
  return (
    <p className={`${font} text-${fontSize}px ${alignment} ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}>
      {content}
    </p>
  )
}

function PreviewButton({ text, link, font, fontSize, alignment, bold, italic, underline }: { text: string; link: string; font: string; fontSize: number; alignment: string; bold: boolean; italic: boolean; underline: boolean }) {
  return (
    <div className={alignment}>
      <Button asChild className={`${font} text-${fontSize}px ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}>
        <a href={link}>{text}</a>
      </Button>
    </div>
  )
}

function PreviewImage({ src, alt, width, height, opacity }: { src: string; alt: string; width: number; height: number; opacity: number }) {
  return (
    <img src={src} alt={alt} style={{ width, height, opacity: opacity / 100 }} className="max-w-full h-auto" />
  )
}

function PreviewVideo({ src, width, height, autoplay, muted, defaultSize }: { src: string; width: number; height: number; autoplay: boolean; muted: boolean; defaultSize: boolean }) {
  return (
    <video
      controls
      src={src}
      autoPlay={autoplay}
      muted={muted}
      style={defaultSize ? {} : { width, height }}
      className="w-full"
    >
      Your browser does not support the video tag.
    </video>
  )
}

function PreviewCarousel({ items, slideCount, showText, showLinks, showButtons, isCardType }: { items: any[]; slideCount: number; showText: boolean; showLinks: boolean; showButtons: boolean; isCardType: boolean }) {
  return (
    <Carousel className="w-full max-w-xs mx-auto">
      <CarouselContent>
        {items.slice(0, slideCount).map((item, index) => (
          <CarouselItem key={index}>
            {isCardType ? (
              <Card>
                <CardHeader>
                  <CardTitle>{item.text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img src={item.image} alt={`Slide ${index + 1}`} className="w-full h-auto" />
                </CardContent>
                {showLinks && (
                  <CardFooter>
                    <a href={item.link} className="text-blue-500 hover:underline">{item.link}</a>
                  </CardFooter>
                )}
                {showButtons && (
                  <CardFooter>
                    <Button>{item.buttonText}</Button>
                  </CardFooter>
                )}
              </Card>
            ) : (
              <div className="relative">
                <img src={item.image} alt={`Slide ${index + 1}`} className="w-full h-auto" />
                {showText && <p className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2">{item.text}</p>}
                {showLinks && <a href={item.link} className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded">Link</a>}
                {showButtons && <Button className="absolute bottom-4 right-4">{item.buttonText}</Button>}
              </div>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

function PreviewForm({ title, subtitle, font, fontSize, alignment, fields }: { title: string; subtitle: string; font: string; fontSize: number; alignment: string; fields: { label: string; type: string }[] }) {
  return (
    <form className={`${font} text-${fontSize}px ${alignment} space-y-4`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p>{subtitle}</p>
      {fields.map((field, index) => (
        <div key={index} className="space-y-2">
          <Label htmlFor={`field-${index}`}>{field.label}</Label>
          {field.type === 'textarea' ? (
            <Textarea id={`field-${index}`} placeholder={field.label} />
          ) : (
            <Input id={`field-${index}`} type={field.type} placeholder={field.label} />
          )}
        </div>
      ))}
      <Button type="submit">Submit</Button>
    </form>
  )
}