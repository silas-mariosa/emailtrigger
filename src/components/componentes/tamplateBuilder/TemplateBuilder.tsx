'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronUp, ChevronDown, Trash2, Settings } from 'lucide-react'

type ComponentType = 'title' | 'paragraph' | 'image' | 'button'

interface EmailComponent {
	type: ComponentType
	content: string
	style: {
		color: string
		fontFamily: string
		fontSize: string
		textAlign: 'left' | 'center' | 'right'
		backgroundColor?: string
		width?: string
		height?: string
		link?: string
		bold?: boolean
		underline?: boolean
	}
}

interface EmailTemplate {
	subject: string
	recipient: string
	components: EmailComponent[]
	style: {
		backgroundColor: string
		textAlign: 'left' | 'center' | 'right'
		footerText: string
	}
}

const fontOptions = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia']
const fontSizeOptions = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

export default function EmailTemplateEditor() {
	const [template, setTemplate] = useState<EmailTemplate>({
		subject: '',
		recipient: '',
		components: [],
		style: {
			backgroundColor: '#ffffff',
			textAlign: 'left',
			footerText: '© 2023 Sua Empresa. Todos os direitos reservados.'
		}
	})
	const [selectedComponentType, setSelectedComponentType] = useState<ComponentType>('title')
	const [newComponentContent, setNewComponentContent] = useState('')

	const handleAddComponent = () => {
		if (newComponentContent.trim()) {
			const newComponent: EmailComponent = {
				type: selectedComponentType,
				content: newComponentContent,
				style: {
					color: '#000000',
					fontFamily: 'Arial',
					fontSize: '16px',
					textAlign: 'left',
					bold: false,
					underline: false,
					...(selectedComponentType === 'button' && { backgroundColor: '#007bff', link: '#' }),
					...(selectedComponentType === 'image' && { width: '100%', height: 'auto' })
				}
			}
			setTemplate(prev => ({
				...prev,
				components: [...prev.components, newComponent]
			}))
			setNewComponentContent('')
		}
	}

	const handleUpdateComponent = (index: number, updates: Partial<EmailComponent>) => {
		setTemplate(prev => ({
			...prev,
			components: prev.components.map((component, i) =>
				i === index ? { ...component, ...updates } : component
			)
		}))
	}

	const handleDeleteComponent = (index: number) => {
		setTemplate(prev => ({
			...prev,
			components: prev.components.filter((_, i) => i !== index)
		}))
	}

	const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
		if ((direction === 'up' && index > 0) || (direction === 'down' && index < template.components.length - 1)) {
			setTemplate(prev => {
				const newComponents = [...prev.components]
				const temp = newComponents[index]
				newComponents[index] = newComponents[index + (direction === 'up' ? -1 : 1)]
				newComponents[index + (direction === 'up' ? -1 : 1)] = temp
				return { ...prev, components: newComponents }
			})
		}
	}

	const generateEmailHtml = (template: EmailTemplate): string => {
		const { subject, recipient, components, style } = template;

		// Header
		let html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${subject}</title>
				<style>
					body {
						background-color: ${style.backgroundColor};
						text-align: ${style.textAlign};
						font-family: Arial, sans-serif;
						color: #333;
						margin: 0;
						padding: 20px;
					}
					.container {
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
						background-color: #fff;
						border-radius: 8px;
						box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
					}
					.footer {
						margin-top: 20px;
						font-size: 12px;
						color: #999;
						text-align: center;
					}
				</style>
			</head>
			<body>
				<div class="container">
		`;

		// Body components
		components.forEach((component) => {
			const { type, content, style } = component;
			const { color, fontFamily, fontSize, textAlign, backgroundColor, width, height, link, bold, underline } = style;

			// Styles for the component
			const componentStyle = `
				color: ${color};
				font-family: ${fontFamily};
				font-size: ${fontSize};
				text-align: ${textAlign};
				${backgroundColor ? `background-color: ${backgroundColor};` : ''}
				${width ? `width: ${width};` : ''}
				${height ? `height: ${height};` : ''}
				${bold ? 'font-weight: bold;' : ''}
				${underline ? 'text-decoration: underline;' : ''}
			`;

			// Render component based on its type
			switch (type) {
				case 'title':
					html += `<h1 style="${componentStyle}">${content}</h1>`;
					break;
				case 'paragraph':
					html += `<p style="${componentStyle}">${content}</p>`;
					break;
				case 'image':
					html += `<img src="${content}" alt="Image" style="${componentStyle}" />`;
					break;
				case 'button':
					html += `<a href="${link}" style="${componentStyle}; padding: 10px 20px; display: inline-block; border-radius: 5px; text-decoration: none; background-color: ${backgroundColor || '#007BFF'}; color: ${color};">${content}</a>`;
					break;
				default:
					break;
			}
		});

		// Footer
		html += `
				</div>
				<div class="footer">
					${style.footerText}
				</div>
			</body>
			</html>
		`;

		return html;
	};

	const handleSave = () => {
		console.log('Template salvo:', template)
		const htmlContent = generateEmailHtml(template);
		console.log('HTML para o e-mail:', htmlContent);
		// Implementar lógica para salvar o template
	}

	const renderComponent = (component: EmailComponent, index: number) => {
		const { type, content, style } = component
		const commonProps = {
			style: {
				color: style.color,
				fontFamily: style.fontFamily,
				fontSize: style.fontSize,
				textAlign: style.textAlign,
				fontWeight: style.bold ? 'bold' : 'normal',
				textDecoration: style.underline ? 'underline' : 'none',
			}
		}

		const componentContent = (() => {
			switch (type) {
				case 'title':
					return <h2 {...commonProps} className="font-bold my-2">{content}</h2>
				case 'paragraph':
					return <p {...commonProps} className="my-2">{content}</p>
				case 'image':
					return (
						<div className='flex flex-con justify-center'>
							<img src={content} alt="Email content" style={{ width: style.width, height: style.height }} className="my-2" />
						</div>
					)
				case 'button':
					return (
						<div style={{ textAlign: style.textAlign }}>
							<a href={style.link} target="_blank" rel="noopener noreferrer">
								<button style={{ ...commonProps.style, backgroundColor: style.backgroundColor }} className="px-4 py-2 rounded my-4 text-white">
									{content}
								</button>
							</a>
						</div>
					)
				default:
					return null
			}
		})()	


		return (
			<div key={index} className="relative group border p-2 my-2">
				{componentContent}
				<div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="grid gap-4">
								{type !== 'image' && (
									<>
										<div className="space-y-2">
											<Label htmlFor={`color-${index}`}>Cor do Texto</Label>
											<Input
												id={`color-${index}`}
												type="color"
												value={style.color}
												onChange={(e) => handleUpdateComponent(index, { style: { ...style, color: e.target.value } })}
											/>
										</div>
										<div>
											<Label htmlFor={`font-${index}`}>Conteúdo</Label>
											<Input
												defaultValue={content}
												onChange={(e) => handleUpdateComponent(index, { content: e.target.value })}
												placeholder={selectedComponentType === 'image' ? 'URL da imagem' : 'Conteúdo do componente'}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`font-${index}`}>Fonte</Label>
											<Select
												onValueChange={(value) => handleUpdateComponent(index, { style: { ...style, fontFamily: value } })}
												defaultValue={style.fontFamily}
											>
												<SelectTrigger id={`font-${index}`}>
													<SelectValue placeholder="Selecione uma fonte" />
												</SelectTrigger>
												<SelectContent>
													{fontOptions.map((font) => (
														<SelectItem key={font} value={font}>{font}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`font-size-${index}`}>Tamanho da Fonte</Label>
											<Select
												onValueChange={(value) => handleUpdateComponent(index, { style: { ...style, fontSize: value } })}
												defaultValue={style.fontSize}
											>
												<SelectTrigger id={`font-size-${index}`}>
													<SelectValue placeholder="Selecione um tamanho" />
												</SelectTrigger>
												<SelectContent>
													{fontSizeOptions.map((size) => (
														<SelectItem key={size} value={size}>{size}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</>
								)}
								{(type === 'title' || type === 'paragraph') && (
									<div className="flex space-x-2">
										<Button
											variant={style.bold ? "default" : "outline"}
											size="sm"
											onClick={() => handleUpdateComponent(index, { style: { ...style, bold: !style.bold } })}
										>
											B
										</Button>
										<Button
											variant={style.underline ? "default" : "outline"}
											size="sm"
											onClick={() => handleUpdateComponent(index, { style: { ...style, underline: !style.underline } })}
										>
											U
										</Button>
									</div>
								)}
								<div className="space-y-2">
									<Label htmlFor={`align-${index}`}>Alinhamento</Label>
									<Select
										onValueChange={(value: 'left' | 'center' | 'right') => handleUpdateComponent(index, { style: { ...style, textAlign: value } })}
										defaultValue={style.textAlign}
									>
										<SelectTrigger id={`align-${index}`}>
											<SelectValue placeholder="Selecione o alinhamento" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="left">Esquerda</SelectItem>
											<SelectItem value="center">Centro</SelectItem>
											<SelectItem value="right">Direita</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{type === 'button' && (
									<>
										<div className="space-y-2">
											<Label htmlFor={`link-${index}`}>Link</Label>
											<Input
												id={`link-${index}`}
												type="url"
												value={style.link}
												onChange={(e) => handleUpdateComponent(index, { style: { ...style, link: e.target.value } })}
												placeholder="https://exemplo.com"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`bg-color-${index}`}>Cor de Fundo</Label>
											<Input
												id={`bg-color-${index}`}
												type="color"
												value={style.backgroundColor}
												onChange={(e) => handleUpdateComponent(index, { style: { ...style, backgroundColor: e.target.value } })}
											/>
										</div>
									</>
								)}
								{type === 'image' && (
									<>
										<div className="space-y-2">
											<Label htmlFor={`width-${index}`}>Largura</Label>
											<Input
												id={`width-${index}`}
												type="text"
												value={style.width}
												onChange={(e) => handleUpdateComponent(index, { style: { ...style, width: e.target.value } })}
												placeholder="100%, 300px, etc."
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`height-${index}`}>Altura</Label>
											<Input
												id={`height-${index}`}
												type="text"
												value={style.height}
												onChange={(e) => handleUpdateComponent(index, { style: { ...style, height: e.target.value } })}
												placeholder="auto, 200px, etc."
											/>
										</div>
									</>
								)}
							</div>
						</PopoverContent>
					</Popover>
					<Button variant="ghost" size="icon" onClick={() => handleMoveComponent(index, 'up')}><ChevronUp className="h-4 w-4" /></Button>
					<Button variant="ghost" size="icon" onClick={() => handleMoveComponent(index, 'down')}><ChevronDown className="h-4 w-4" /></Button>
					<Button variant="ghost" size="icon" onClick={() => handleDeleteComponent(index)}><Trash2 className="h-4 w-4" /></Button>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-2">
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-2xl font-bold">Editor de Template de E-mail Marketing</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="subject">Assunto</Label>
						<Input
							id="subject"
							value={template.subject}
							onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
							placeholder="Digite o assunto do e-mail"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="recipient">Destinatário</Label>
						<Input
							id="recipient"
							value={template.recipient}
							onChange={(e) => setTemplate(prev => ({ ...prev, recipient: e.target.value }))}
							placeholder="Digite o e-mail do destinatário"
							type="email"
						/>
					</div>
					<div className="space-y-2">
						<Label>Adicionar Componente</Label>
						<div className="flex space-x-2">
							<Select onValueChange={(value: ComponentType) => setSelectedComponentType(value)}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Tipo de Componente" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="title">Título</SelectItem>
									<SelectItem value="paragraph">Parágrafo</SelectItem>
									<SelectItem value="image">Imagem</SelectItem>
									<SelectItem value="button">Botão</SelectItem>
								</SelectContent>
							</Select>
							<Input
								value={newComponentContent}
								onChange={(e) => setNewComponentContent(e.target.value)}
								placeholder={selectedComponentType === 'image' ? 'URL da imagem' : 'Conteúdo do componente'}
							/>
							<Button onClick={handleAddComponent}>Adicionar</Button>
						</div>
					</div>
					<div className="border p-4 min-h-[200px]" style={{ backgroundColor: template.style.backgroundColor, textAlign: template.style.textAlign }}>
						<h3 className="text-lg font-semibold mb-2">Prévia do E-mail:</h3>
						{template.components.map((component, index) => renderComponent(component, index))}
						<footer className="mt-4 text-sm text-gray-500">{template.style.footerText}</footer>
					</div>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">Configurações Gerais</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="grid gap-4">
								<div className="space-y-2">
									<Label htmlFor="email-bg-color">Cor de Fundo do E-mail</Label>
									<Input
										id="email-bg-color"
										type="color"
										value={template.style.backgroundColor}
										onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, backgroundColor: e.target.value } }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email-align">Alinhamento Geral</Label>
									<Select
										onValueChange={(value: 'left' | 'center' | 'right') => setTemplate(prev => ({ ...prev, style: { ...prev.style, textAlign: value } }))}
										defaultValue={template.style.textAlign}
									>
										<SelectTrigger id="email-align">
											<SelectValue placeholder="Selecione o alinhamento" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="left">Esquerda</SelectItem>
											<SelectItem value="center">Centro</SelectItem>
											<SelectItem value="right">Direita</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="footer-text">Texto do Rodapé</Label>
									<Input
										id="footer-text"
										value={template.style.footerText}
										onChange={(e) => setTemplate(prev => ({ ...prev, style: { ...prev.style, footerText: e.target.value } }))}
										placeholder="Digite o texto do rodapé"
									/>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</CardContent>
				<CardFooter>
					<Button onClick={handleSave} className="w-full">Salvar Template</Button>
				</CardFooter>
			</Card>
		</div>
	)
}