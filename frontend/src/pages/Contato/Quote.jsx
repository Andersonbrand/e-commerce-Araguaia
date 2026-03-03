import './quote.css';

import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

const WHATSAPP_NUMBER = '5577981046133';
const MAIL_TO = 'robertaaraguaia10@gmail.com';

function formatDocument(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function getDocumentLabel(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return 'CPF / CNPJ';
    if (digits.length <= 11) return 'CPF';
    return 'CNPJ';
}

function validateDocument(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
}

export default function Quote() {
    const { cartItems, clearCart } = useCart();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        document: '',
        message: '',
    });
    const [status, setStatus] = useState(null);
    const [whatsappPending, setWhatsappPending] = useState(false);

    // Detecta retorno do WhatsApp e exibe sucesso + limpa carrinho
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && whatsappPending) {
                setWhatsappPending(false);
                setStatus({ type: 'success', text: 'Orçamento enviado pelo WhatsApp com sucesso!' });
                clearCart();
                setForm({ name: '', email: '', phone: '', address: '', document: '', message: '' });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [whatsappPending, clearCart]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'document') {
            setForm({ ...form, document: formatDocument(value) });
        } else {
            setForm({ ...form, [name]: value });
        }
        if (status) setStatus(null);
    };

    function validateForm() {
        // Verifica se há itens no carrinho
        if (cartItems.length === 0) {
            setStatus({ type: 'error', text: 'Adicione pelo menos um item ao orçamento antes de enviar.' });
            return false;
        }
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.document.trim() || !form.message.trim()) {
            setStatus({ type: 'error', text: 'Preencha todos os campos antes de enviar.' });
            return false;
        }
        if (!validateDocument(form.document)) {
            setStatus({ type: 'error', text: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.' });
            return false;
        }
        return true;
    }

    // Monta o link mailto com todos os dados preenchidos
    function buildMailtoLink() {
        const docLabel = getDocumentLabel(form.document);
        const itemsText = cartItems.length > 0
            ? '\n\nItens do Orçamento:\n' + cartItems.map(i => `- ${i.name} (x${i.quantity})`).join('\n')
            : '\n\nNenhum item no carrinho.';

        const body =
            `Nome: ${form.name}` +
            `\nE-mail: ${form.email}` +
            `\nTelefone: ${form.phone}` +
            `\nEndereço: ${form.address}` +
            `\n${docLabel}: ${form.document}` +
            itemsText +
            `\n\nMensagem: ${form.message}`;

        return `mailto:${MAIL_TO}?subject=${encodeURIComponent('Novo Orçamento - ' + form.name)}&body=${encodeURIComponent(body)}`;
    }

    // Clique no botão de e-mail: valida, abre app de e-mail, exibe sucesso e limpa
    const handleEmailClick = (e) => {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }
        setStatus({ type: 'success', text: 'Abrindo seu e-mail com o orçamento preenchido!' });
        clearCart();
        setForm({ name: '', email: '', phone: '', address: '', document: '', message: '' });
    };

    // Monta o link do WhatsApp
    function buildWhatsAppLink() {
        const docLabel = getDocumentLabel(form.document);
        const docInfo = form.document ? `\n${docLabel}: ${form.document}` : '';
        const itemsText = cartItems.length > 0
            ? '\n\nItens:\n' + cartItems.map((i) => `- ${i.name} (x${i.quantity})`).join('\n')
            : '';
        const text = `Olá! Me chamo ${form.name || '...'} e gostaria de solicitar um orçamento.${docInfo}${itemsText}\n\nMensagem: ${form.message || '...'}`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    }

    const docLabel = getDocumentLabel(form.document);

    return (
        <section className="quote-section">
            <div className="quote-wrapper">

                {/* COLUNA ESQUERDA */}
                <div className="quote-left">
                    <h2 className="quote-title">Orçamento</h2>

                    <p className="quote-description">
                        Quer saber mais sobre nossos produtos e serviços e como podemos ajudar
                        na sua obra? Entre em contato com a gente pelos canais abaixo.
                    </p>

                    {cartItems.length > 0 && (
                        <div className="quote-cart-summary">
                            <h3 className="quote-cart-summary__title">Itens do seu orçamento</h3>
                            <ul className="quote-cart-summary__list">
                                {cartItems.map((item) => (
                                    <li key={item._id} className="quote-cart-summary__item">
                                        <span className="quote-cart-summary__name">{item.name}</span>
                                        <span className="quote-cart-summary__qty">x{item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {status && (
                        <div className={`quote-alert quote-alert--${status.type}`}>
                            {status.text}
                        </div>
                    )}

                    <form className="quote-form" noValidate>
                        <input
                            name="name"
                            placeholder="Nome *"
                            value={form.name}
                            onChange={handleChange}
                            autoComplete="name"
                            required
                        />
                        <input
                            name="email"
                            type="email"
                            placeholder="E-mail *"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                        <input
                            name="phone"
                            type="tel"
                            placeholder="Telefone *"
                            value={form.phone}
                            onChange={handleChange}
                            autoComplete="tel"
                            required
                        />
                        <input
                            name="address"
                            placeholder="Endereço *"
                            value={form.address}
                            onChange={handleChange}
                            autoComplete="street-address"
                            required
                        />

                        <div className="quote-document-field">
                            <input
                                name="document"
                                placeholder={`${docLabel} *`}
                                value={form.document}
                                onChange={handleChange}
                                inputMode="numeric"
                                autoComplete="off"
                            />
                            {form.document.replace(/\D/g, '').length > 0 && (
                                <span className="quote-document-label">{docLabel}</span>
                            )}
                        </div>

                        <textarea
                            className="quote-textarea"
                            name="message"
                            placeholder="Mensagem *"
                            value={form.message}
                            onChange={handleChange}
                            autoComplete="off"
                        />

                        <div className="quote-actions">
                            {/* Abre o app de e-mail do usuário com tudo preenchido */}
                            <a
                                className="quote-button"
                                href={buildMailtoLink()}
                                onClick={handleEmailClick}
                            >
                                Enviar por e-mail →
                            </a>

                            {/* Abre o WhatsApp com os dados preenchidos */}
                            <a
                                className="quote-whatsapp"
                                href={buildWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    if (!validateForm()) {
                                        e.preventDefault();
                                        return;
                                    }
                                    setWhatsappPending(true);
                                }}
                            >
                                Enviar pelo WhatsApp
                            </a>
                        </div>
                    </form>
                </div>

                {/* COLUNA DIREITA */}
                <div className="quote-right">
                    <div className="contact-card">
                        <div className="contact-item">
                            <h4>📍 Endereço</h4>
                            <p>BR 122 km 02 – Saída para Pindaí<br />Guanambi – BA, 46430-000</p>
                        </div>

                        <div className="contact-item">
                            <h4>📞 Telefone</h4>
                            <p>
                                <a className="contact-link" href="tel:+557798104613">+55 77 98104-6133</a>
                            </p>
                        </div>

                        <div className="contact-item">
                            <h4>💬 WhatsApp</h4>
                            <p>
                                <a
                                    className="contact-link contact-link--whatsapp"
                                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Abrir conversa
                                </a>
                            </p>
                        </div>

                        <div className="contact-item">
                            <h4>✉️ Email</h4>
                            <p>
                                <a className="contact-link" href="mailto:comercialaraguaia2018@outlook.com">
                                    comercialaraguaia2018@outlook.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}