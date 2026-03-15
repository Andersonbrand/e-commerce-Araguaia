import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function Footer() {
    return (
        <footer className="border-t border-border bg-white">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-10 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/homepage" className="flex items-center gap-3">
                            <AppLogo size={36} />
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-bold text-base tracking-tight text-foreground">
                                    Comercial <span className="text-primary">Araguaia</span>
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-muted">
                                    Materiais de Construção
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm text-muted leading-relaxed max-w-xs">
                            Revenda especializada em materiais de construção civil com qualidade garantida.
                            Atendendo Guanambi e região com os melhores preços.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground mb-4">Navegação</p>
                        <nav className="flex flex-col gap-3">
                            {[
                                { label: 'Início',    href: '/homepage' },
                                { label: 'Produtos',  href: '/products' },
                                { label: 'Sobre Nós', href: '/sobre' },
                                { label: 'Orçamento', href: '/homepage#orcamento' },
                            ].map((l) => (
                                <Link key={l.href} href={l.href}
                                    className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Contact */}
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground mb-4">Contato</p>
                        <div className="space-y-3 text-sm text-muted">
                            <a href="https://wa.me/5577981046133" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-primary transition-colors">
                                <span className="text-primary font-bold">WhatsApp:</span>
                                (77) 9 8104-6133
                            </a>
                            <a href="mailto:comercialaraguaia2018@outlook.com"
                                className="flex items-center gap-2 hover:text-primary transition-colors">
                                <span className="text-primary font-bold">E-mail:</span>
                                comercialaraguaia2018@outlook.com
                            </a>
                            <p>
                                <span className="text-primary font-bold">Endereço:</span> Guanambi / Bahia
                            </p>
                            <p className="text-[12px]">Seg–Sex, 8h–18h · Sáb, 8h–12h</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[12px] text-muted">
                        © {new Date().getFullYear()} Comercial Araguaia · Guanambi, Bahia
                    </span>
                    <div className="flex items-center gap-6 text-[12px] text-muted">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link>
                        <span className="text-border">·</span>
                        <Link href="#" className="hover:text-foreground transition-colors">Termos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
