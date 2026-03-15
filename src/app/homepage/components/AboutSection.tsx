'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';

const values = [
{
  icon: 'TruckIcon',
  title: 'Logística Própria',
  desc: 'Frota dedicada para entregas pontuais em obras de qualquer porte.'
},
{
  icon: 'CubeIcon',
  title: 'Estoque Garantido',
  desc: 'Mais de 800 SKUs disponíveis para pronta entrega em todo o Brasil.'
},
{
  icon: 'UserGroupIcon',
  title: 'Atendimento Técnico',
  desc: 'Equipe especializada para auxiliar na escolha dos materiais certos.'
}];


export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.15 }
    );

    const items = sectionRef.current?.querySelectorAll('.animate-on-scroll');
    items?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="sobre" ref={sectionRef} className="py-32 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-surface/40 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: image collage */}
          <div className="grid grid-cols-2 gap-5 animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="space-y-5">
              <div className="aspect-[3/4] rounded-4xl overflow-hidden shadow-blue-lg">
                <AppImage
                  src="https://images.unsplash.com/photo-1628839835275-2b24c0596853"
                  alt="Operário trabalhando com materiais de construção em obra"
                  className="w-full h-full object-cover"
                  fill />
                
              </div>
              {/* Stat card */}
              <div className="bg-primary rounded-4xl p-8 text-white">
                <p className="text-4xl font-display font-bold italic">15+</p>
                <p className="text-[11px] uppercase tracking-[0.25em] opacity-80 mt-1">Anos de experiência</p>
              </div>
            </div>
            <div className="pt-16 space-y-5">
              {/* Glass stat */}
              <div className="glass-dark rounded-4xl p-8">
                <p className="text-4xl font-display font-bold text-foreground">800+</p>
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted mt-1">Produtos em estoque</p>
              </div>
              <div className="aspect-[3/4] rounded-4xl overflow-hidden shadow-xl">
                <AppImage
                  src="https://img.rocket.new/generatedImages/rocket_gen_img_156c56915-1773368820294.png"
                  alt="Estoque de materiais de construção civil organizado"
                  className="w-full h-full object-cover"
                  fill />
                
              </div>
            </div>
          </div>

          {/* Right: content */}
          <div className="space-y-10 animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000 delay-200">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent">
                Nossa Filosofia
              </span>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                Construindo{' '}
                <span className="font-display italic text-gradient-blue">relações</span>{' '}
                sólidas.
              </h2>
            </div>

            <p className="text-lg text-muted leading-relaxed">
              A ConstruMat nasceu da necessidade de um fornecedor confiável para obras de todos os portes. Desde 2009, entregamos materiais de alta qualidade com transparência nos preços e agilidade no atendimento.
            </p>

            <div className="space-y-6">
              {values.map((item, i) =>
              <div
                key={item.title}
                className="flex gap-5 items-start group"
                style={{ transitionDelay: `${i * 100}ms` }}>
                
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <AppIcon name={item.icon as any} size={20} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}