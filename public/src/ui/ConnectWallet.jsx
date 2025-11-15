import { useDynamicContext, useDynamicModals } from "@dynamic-labs/sdk-react-core";
import { useEffect, useRef } from "react";

export function ConnectWallet() {
    const { setShowLinkNewWalletModal } = useDynamicModals();
    const {
        primaryWallet,
        setShowAuthFlow,
        user,
        handleLogOut
    } = useDynamicContext();

    const wasConnected = useRef(false);

    useEffect(() => {
        window.openDynamicWalletModal = () => {
            if (!!user || !!primaryWallet) {
                setShowLinkNewWalletModal(true);
            } else {
                setShowAuthFlow(true);
            }
        };
        return () => {
            delete window.openDynamicWalletModal;
        };
    }, [user, primaryWallet, setShowLinkNewWalletModal, setShowAuthFlow]);

    useEffect(() => {
        const btn = document.getElementById('connect-wallet-btn');
        const isConnected = !!user || !!primaryWallet;
        if (btn) {
            if (isConnected) {
                btn.textContent = 'Disconnect Wallet';
                btn.onclick = async () => {
                    await handleLogOut();
                    btn.textContent = 'Connect Wallet';
                }
            } else {
                btn.textContent = 'Connect Wallet';
                btn.onclick = () => {
                    if (window.openDynamicWalletModal) {
                        window.openDynamicWalletModal();
                    }
                };
            }
            // Remove any previous click handlers to avoid stacking
            // btn.onclick = null;
            // console.log('isAuthenticated:', isAuthenticated);
            // if (isAuthenticated) {
            //     btn.onclick = () => {
            //         // Move to InstructionsScene and remove overlay
            //         if (window.phaserGame) {
            //             window.phaserGame.scene.start('InstructionsScene');
            //             const titleOverlay = document.getElementById('title-overlay');
            //             if (titleOverlay) {
            //                 titleOverlay.remove();
            //             }
            //         }
            //     };
            
            // } else {
            //     btn.onclick = () => {
            //         if (window.openDynamicWalletModal) {
            //             window.openDynamicWalletModal();
            //         }
            //     };
            // }
        }

        if (isConnected && !wasConnected.current) {
            showWalletConnectedPopup();
            wasConnected.current = true;
        }
        if (!isConnected) {
            wasConnected.current = false;
        }
    }, [user, primaryWallet, handleLogOut]);

    useEffect(() => {
        // Expose wallet address globally for Phaser/vanilla JS
        if (primaryWallet && primaryWallet.address) {
            window.dynamicWalletAddress = primaryWallet.address;
        } else if (user && user.publicWalletAddress) {
            window.dynamicWalletAddress = user.publicWalletAddress;
        } else {
            window.dynamicWalletAddress = null;
        }
    }, [user, primaryWallet]);

    function showWalletConnectedPopup() {
        const popup = document.createElement('div');
        popup.textContent = 'Wallet Connected!';
        popup.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(212, 15, 2, 1);
            color: #fff;
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 18px;
            z-index: 9999;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            opacity: 0.95;
        `;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
            if (window.phaserGame) {
                window.phaserGame.scene.start('InstructionsScene');
                const titleOverlay = document.getElementById('title-overlay');
                if (titleOverlay) {
                    titleOverlay.remove();
                }
            }
        }, 3200);
    }

    return null;
}