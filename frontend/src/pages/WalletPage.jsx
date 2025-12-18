import React, { useEffect, useState } from 'react';
import walletService from '../services/wallet.service';
import LoadingSpinner from '../components/LoadingSpinner';
import Swal from 'sweetalert2';
import './WalletPage.css';

const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        fetchWalletData();
    }, []);

    // Helper to format date safely
    const formatDate = (dateString) => {
        if (!dateString) return 'Tarih yok';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Try fixing common Postgres format issue
                const fixed = new Date(dateString.replace(' ', 'T'));
                if (isNaN(fixed.getTime())) return 'Tarih yok';
                return fixed.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
            return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) {
            return 'Tarih yok';
        }
    };

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [walletData, historyData] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getHistory()
            ]);
            setWallet(walletData);
            setHistory(historyData);
        } catch (error) {
            console.error(error);
            Swal.fire('Hata', 'Cüzdan bilgileri alınamadı', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        // Step 1: Input Amount
        const { value: amount } = await Swal.fire({
            title: '💰 Bakiye Yükle',
            html: `
                <div class="topup-container">
                    <p class="topup-subtitle">Yüklemek istediğiniz tutarı seçin veya girin</p>
                    
                    <div class="amount-buttons">
                        <button type="button" class="amount-btn" data-amount="25">25 ₺</button>
                        <button type="button" class="amount-btn" data-amount="50">50 ₺</button>
                        <button type="button" class="amount-btn active" data-amount="100">100 ₺</button>
                        <button type="button" class="amount-btn" data-amount="200">200 ₺</button>
                        <button type="button" class="amount-btn" data-amount="500">500 ₺</button>
                    </div>
                    
                    <div class="custom-amount-wrapper">
                        <span class="currency-symbol">₺</span>
                        <input type="number" id="amount-input" class="custom-amount-input" 
                               value="100" min="1" placeholder="Tutar">
                    </div>
                </div>
                
                <style>
                    .topup-container { text-align: center; padding: 5px 0; }
                    .topup-subtitle { color: #6b7280; margin-bottom: 20px; font-size: 0.95rem; }
                    
                    .amount-buttons { 
                        display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 25px; 
                    }
                    .amount-btn {
                        padding: 14px 22px; border: 2px solid #d1d5db; border-radius: 10px;
                        background: #f9fafb; color: #374151; font-weight: 600; font-size: 1rem;
                        cursor: pointer; transition: all 0.2s ease; min-width: 70px;
                    }
                    .amount-btn:hover { 
                        border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; 
                        transform: translateY(-2px); 
                    }
                    .amount-btn.active { 
                        border-color: #2563eb; background: #2563eb; color: white; 
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                    }
                    
                    .custom-amount-wrapper {
                        position: relative; display: inline-block; width: 180px;
                    }
                    .currency-symbol {
                        position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
                        font-size: 1.3rem; font-weight: 600; color: #6b7280;
                    }
                    .custom-amount-input {
                        width: 100%; padding: 16px 20px 16px 45px; font-size: 1.5rem; font-weight: 700;
                        border: 2px solid #d1d5db; border-radius: 12px; text-align: center;
                        transition: all 0.2s ease; color: #1f2937;
                    }
                    .custom-amount-input:focus {
                        outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
                    }
                </style>
            `,
            showCancelButton: true,
            confirmButtonText: 'Devam Et →',
            cancelButtonText: 'İptal',
            didOpen: () => {
                // Add click handlers after popup opens
                const buttons = document.querySelectorAll('.amount-btn');
                const input = document.getElementById('amount-input');

                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        buttons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        input.value = btn.dataset.amount;
                    });
                });

                input.addEventListener('input', () => {
                    buttons.forEach(b => b.classList.remove('active'));
                });
            },
            preConfirm: () => {
                const value = document.getElementById('amount-input').value;
                if (!value || value <= 0) {
                    Swal.showValidationMessage('Geçerli bir tutar giriniz!');
                    return false;
                }
                return value;
            }
        });

        if (!amount) return;

        // Step 2: Fetch saved cards
        let savedCards = [];
        try {
            savedCards = await walletService.getSavedCards();
        } catch (e) {
            console.log('No saved cards found');
        }

        let selectedCardId = null;
        let newCardData = null;

        // Step 3: If user has saved cards, show selection
        if (savedCards.length > 0) {
            const cardsHtml = savedCards.map((card, idx) => `
                <div onclick="document.querySelectorAll('.card-option').forEach(c=>c.style.borderColor='#e2e8f0'); this.style.borderColor='#667eea'; document.getElementById('selected-card').value='${card.id}'"
                     class="card-option" 
                     style="display: flex; align-items: center; gap: 15px; padding: 18px; margin-bottom: 12px; 
                            border: 3px solid ${card.is_default ? '#667eea' : '#e2e8f0'}; border-radius: 16px; 
                            cursor: pointer; transition: all 0.3s ease; background: white;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.08);"
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(102,126,234,0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.08)'">
                    <div style="width: 50px; height: 35px; background: linear-gradient(135deg, ${card.card_brand === 'Mastercard' ? '#eb001b, #f79e1b' : card.card_brand === 'Amex' ? '#006fcf, #00aeef' : '#1a1f71, #00579f'}); 
                                border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 0.7rem; font-weight: bold;">${card.card_brand}</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1e293b;">•••• •••• •••• ${card.card_last_four}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">${card.card_holder} · ${card.expiry_month}/${card.expiry_year}</div>
                    </div>
                    ${card.is_default ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">VARSAYILAN</span>' : ''}
                </div>
            `).join('');

            const { value: cardChoice } = await Swal.fire({
                title: '<span style="font-weight: 700;">💳 Ödeme Yöntemi</span>',
                html: `
                    <input type="hidden" id="selected-card" value="${savedCards.find(c => c.is_default)?.id || savedCards[0].id}">
                    <div style="padding: 15px 0;">
                        <p style="color: #64748b; margin-bottom: 20px; font-size: 0.95rem;">Kayıtlı kartlarınızdan birini seçin veya yeni kart ekleyin</p>
                        ${cardsHtml}
                        <div onclick="document.querySelectorAll('.card-option').forEach(c=>c.style.borderColor='#e2e8f0'); this.style.borderColor='#10b981'; document.getElementById('selected-card').value='new'"
                             class="card-option"
                             style="display: flex; align-items: center; gap: 15px; padding: 18px; 
                                    border: 3px dashed #e2e8f0; border-radius: 16px; cursor: pointer; 
                                    transition: all 0.3s ease; background: #f8fafc;"
                             onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4'"
                             onmouseout="if(document.getElementById('selected-card').value!=='new'){this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'}">
                            <div style="width: 50px; height: 35px; background: linear-gradient(135deg, #10b981, #34d399); 
                                        border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 1.5rem;">+</span>
                            </div>
                            <div style="font-weight: 600; color: #10b981;">Yeni Kart Ekle</div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: `<span style="display: flex; align-items: center; gap: 8px;">💰 ${amount} TL Öde</span>`,
                cancelButtonText: 'İptal',
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#94a3b8',
                width: 480,
                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                preConfirm: () => document.getElementById('selected-card').value
            });

            if (!cardChoice) return;

            if (cardChoice === 'new') {
                selectedCardId = null; // Will enter new card
            } else {
                selectedCardId = cardChoice;
            }
        }

        // Step 4: If no saved cards or user chose "new", show card entry form
        if (!selectedCardId) {
            const { value: cardData, isConfirmed } = await Swal.fire({
                title: '<span style="font-weight: 700;">💳 Kart Bilgileri</span>',
                html: `
                    <div style="padding: 15px 0;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                    padding: 25px; border-radius: 20px; color: white; margin-bottom: 25px;
                                    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; 
                                        background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                            <div style="position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; 
                                        background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; position: relative;">
                                <span style="font-size: 1.8rem;">💳</span>
                                <span id="brand-display" style="font-size: 0.9rem; opacity: 0.9; font-weight: 600;">VISA</span>
                            </div>
                            <div id="card-display" style="font-size: 1.5rem; letter-spacing: 4px; font-family: 'Courier New', monospace; margin-bottom: 20px; position: relative;">
                                •••• •••• •••• ••••
                            </div>
                            <div style="display: flex; justify-content: space-between; position: relative;">
                                <div>
                                    <div style="font-size: 0.65rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px;">Kart Sahibi</div>
                                    <div id="holder-display" style="font-size: 0.95rem; font-weight: 500; margin-top: 3px;">AD SOYAD</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.65rem; opacity: 0.7; letter-spacing: 1px;">Son Kullanma</div>
                                    <div id="expiry-display" style="font-size: 0.95rem; font-weight: 500; margin-top: 3px;">••/••</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <input type="text" id="card-holder" placeholder="Kart Sahibi Adı Soyadı"
                                   style="padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 1rem;
                                          transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
                                   oninput="document.getElementById('holder-display').textContent = this.value.toUpperCase() || 'AD SOYAD'"
                                   onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 4px rgba(102,126,234,0.15)'"
                                   onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                            <input type="text" id="card-number" placeholder="Kart Numarası" maxlength="19"
                                   style="padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 1.1rem;
                                          font-family: 'Courier New', monospace; letter-spacing: 3px; transition: all 0.3s ease;
                                          box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
                                   oninput="let v=this.value.replace(/\\s/g,'').replace(/(.{4})/g,'$1 ').trim(); this.value=v;
                                            document.getElementById('card-display').textContent = v.padEnd(19, '•').replace(/(.{4})/g,'$1 ').trim();
                                            let brand='VISA'; if(v[0]==='5') brand='MASTERCARD'; else if(v[0]==='3') brand='AMEX';
                                            document.getElementById('brand-display').textContent = brand;"
                                   onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 4px rgba(102,126,234,0.15)'"
                                   onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                            <div style="display: flex; gap: 14px;">
                                <input type="text" id="card-expiry" placeholder="AA/YY" maxlength="5"
                                       style="flex: 1; padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 1rem;
                                              text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
                                       oninput="let v=this.value.replace(/\\D/g,''); if(v.length>=2) v=v.slice(0,2)+'/'+v.slice(2); this.value=v;
                                                document.getElementById('expiry-display').textContent = v || '••/••';"
                                       onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 4px rgba(102,126,234,0.15)'"
                                       onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                                <input type="text" id="card-cvc" placeholder="CVC" maxlength="3"
                                       style="flex: 1; padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 14px; font-size: 1rem;
                                              text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
                                       oninput="this.value=this.value.replace(/\\D/g,'');"
                                       onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 4px rgba(102,126,234,0.15)'"
                                       onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                            </div>
                            <label style="display: flex; align-items: center; gap: 12px; padding: 16px; 
                                          background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 14px; 
                                          cursor: pointer; margin-top: 5px; transition: all 0.3s ease;
                                          border: 2px solid transparent;"
                                   onmouseover="this.style.borderColor='#667eea'"
                                   onmouseout="this.style.borderColor='transparent'">
                                <input type="checkbox" id="save-card" checked style="width: 22px; height: 22px; accent-color: #667eea;">
                                <span style="color: #475569; font-weight: 500;">Bu kartı sonraki ödemeler için kaydet</span>
                            </label>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: `<span style="display: flex; align-items: center; gap: 8px;">💰 ${amount} TL Öde</span>`,
                cancelButtonText: 'Geri',
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#94a3b8',
                width: 480,
                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' },
                preConfirm: () => {
                    const holder = document.getElementById('card-holder').value;
                    const number = document.getElementById('card-number').value.replace(/\s/g, '');
                    const expiry = document.getElementById('card-expiry').value;
                    const cvc = document.getElementById('card-cvc').value;
                    const saveCard = document.getElementById('save-card').checked;

                    if (!holder || holder.length < 3) {
                        Swal.showValidationMessage('Kart sahibi adını giriniz');
                        return false;
                    }
                    if (!number || number.length < 16) {
                        Swal.showValidationMessage('Geçerli bir kart numarası giriniz');
                        return false;
                    }
                    if (!expiry || expiry.length < 5) {
                        Swal.showValidationMessage('Son kullanma tarihini giriniz');
                        return false;
                    }
                    if (!cvc || cvc.length < 3) {
                        Swal.showValidationMessage('CVC kodunu giriniz');
                        return false;
                    }
                    return { holder, number, expiry, cvc, saveCard };
                }
            });

            if (!isConfirmed) return;
            newCardData = cardData;
        }

        // Step 5: Process Payment
        try {
            Swal.fire({
                title: '<span style="color: #667eea;">💳 Ödeme İşleniyor...</span>',
                html: `
                    <div style="padding: 40px 0;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 25px; 
                                    border: 5px solid #e2e8f0; border-top-color: #667eea;
                                    border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="color: #64748b; font-size: 1rem;">Bankanızla güvenli iletişim kuruluyor...</p>
                        <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 10px;">🔒 256-bit SSL şifreleme</p>
                    </div>
                    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                `,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Process payment
            await walletService.topUp(amount);

            // Save card if requested
            if (newCardData && newCardData.saveCard) {
                try {
                    const [expiryMonth, expiryYear] = newCardData.expiry.split('/');
                    await walletService.saveCard({
                        cardHolder: newCardData.holder,
                        cardNumber: newCardData.number,
                        expiryMonth,
                        expiryYear,
                        setAsDefault: true
                    });
                } catch (e) {
                    console.log('Card save failed:', e);
                }
            }

            await fetchWalletData();

            Swal.fire({
                title: '<span style="color: #10b981;">✓ Ödeme Başarılı!</span>',
                html: `
                    <div style="padding: 25px 0;">
                        <div style="width: 90px; height: 90px; margin: 0 auto 25px; 
                                    background: linear-gradient(135deg, #10b981, #34d399);
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                                    box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4); animation: successPop 0.5s ease;">
                            <span style="font-size: 3rem; color: white;">✓</span>
                        </div>
                        <p style="font-size: 2rem; font-weight: 800; color: #10b981; margin-bottom: 10px;">${amount} TL</p>
                        <p style="color: #64748b; font-size: 1.05rem;">Cüzdanınıza başarıyla yüklendi!</p>
                        ${newCardData?.saveCard ? '<p style="color: #94a3b8; font-size: 0.9rem; margin-top: 15px;">💳 Kartınız kaydedildi</p>' : ''}
                    </div>
                    <style>@keyframes successPop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }</style>
                `,
                confirmButtonText: 'Tamam',
                confirmButtonColor: '#10b981',
                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: '<span style="color: #ef4444;">❌ Ödeme Başarısız</span>',
                html: '<p style="color: #64748b; padding: 20px 0;">İşlem sırasında bir hata oluştu.<br>Lütfen tekrar deneyiniz.</p>',
                confirmButtonText: 'Tamam',
                confirmButtonColor: '#ef4444',
                showClass: { popup: 'animate__animated animate__shakeX' }
            });
        }
    };

    if (loading) return <LoadingSpinner message="Cüzdanınız yükleniyor..." />;

    return (
        <div className="wallet-page-container">
            <h1 className="page-title">Cüzdanım</h1>

            <div className="wallet-summary-card">
                <div className="balance-info">
                    <span className="balance-label">Mevcut Bakiye</span>
                    <div className="balance-amount-row">
                        <span className="balance-amount">
                            {parseFloat(wallet?.balance || 0).toFixed(2)}
                        </span>
                        <span className="balance-currency">TL</span>
                    </div>
                </div>
                <button className="top-up-btn" onClick={handleTopUp}>
                    + Bakiye Yükle
                </button>
            </div>

            <div className="transaction-history-section">
                <h2>İşlem Geçmişi</h2>
                <div className="history-table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>İşlem</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? (
                                history.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{formatDate(tx.created_at)}</td>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{tx.description || (tx.type?.toLowerCase() === 'credit' ? 'Bakiye Yükleme' : 'Harcama')}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{tx.reference_id || ''}</div>
                                        </td>
                                        <td className={tx.type?.toLowerCase() === 'credit' ? 'amount-plus' : 'amount-minus'}>
                                            {tx.type?.toLowerCase() === 'credit' ? '+' : ''}{parseFloat(tx.amount).toFixed(2)} TL
                                        </td>
                                        <td>
                                            <span className={`status-badge ${tx.status?.toLowerCase() || 'completed'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="no-data">Henüz işlem geçmişi yok.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default WalletPage;
