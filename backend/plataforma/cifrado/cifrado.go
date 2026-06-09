package cifrado

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
)

// Cifrar encripta texto con AES-256-GCM usando clave en hex (64 chars = 32 bytes).
// Retorna el texto cifrado como hex: nonce (24 chars) + ciphertext.
func Cifrar(texto, claveHex string) (string, error) {
	clave, err := hex.DecodeString(claveHex)
	if err != nil || len(clave) != 32 {
		return "", errors.New("clave AES invalida: debe ser hex de 32 bytes")
	}

	bloque, err := aes.NewCipher(clave)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(bloque)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	cifrado := gcm.Seal(nonce, nonce, []byte(texto), nil)
	return hex.EncodeToString(cifrado), nil
}

// Descifrar revierte Cifrar. Recibe el texto cifrado en hex y retorna el texto original.
func Descifrar(cifradoHex, claveHex string) (string, error) {
	clave, err := hex.DecodeString(claveHex)
	if err != nil || len(clave) != 32 {
		return "", errors.New("clave AES invalida: debe ser hex de 32 bytes")
	}

	datos, err := hex.DecodeString(cifradoHex)
	if err != nil {
		return "", errors.New("cifrado invalido: no es hex valido")
	}

	bloque, err := aes.NewCipher(clave)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(bloque)
	if err != nil {
		return "", err
	}

	tamNonce := gcm.NonceSize()
	if len(datos) < tamNonce {
		return "", errors.New("cifrado demasiado corto")
	}

	nonce, cifrado := datos[:tamNonce], datos[tamNonce:]
	texto, err := gcm.Open(nil, nonce, cifrado, nil)
	if err != nil {
		return "", errors.New("descifrado fallido: token corrompido o clave incorrecta")
	}

	return string(texto), nil
}
