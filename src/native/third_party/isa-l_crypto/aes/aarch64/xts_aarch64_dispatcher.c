/**********************************************************************
  Copyright(c) 2021 Arm Corporation All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in
      the documentation and/or other materials provided with the
      distribution.
    * Neither the name of Arm Corporation nor the names of its
      contributors may be used to endorse or promote products derived
      from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
  OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**********************************************************************/
#include <aarch64_multibinary.h>

#undef PROVIDER_BASIC
#define PROVIDER_BASIC(a) (void*)0

static unsigned long is_crypto_available(void)
{
	unsigned long auxval = getauxval(AT_HWCAP);
	return (auxval & (HWCAP_ASIMD | HWCAP_AES)) == (HWCAP_ASIMD | HWCAP_AES);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_128_enc)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_128_enc_ce);
	}
	return PROVIDER_BASIC(XTS_AES_128_enc);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_128_dec)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_128_dec_ce);
	}
	return PROVIDER_BASIC(XTS_AES_128_dec);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_128_enc_expanded_key)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_128_enc_expanded_key_ce);
	}
	return PROVIDER_BASIC(XTS_AES_128_enc_expanded_key);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_128_dec_expanded_key)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_128_dec_expanded_key_ce);
	}
	return PROVIDER_BASIC(XTS_AES_128_dec_expanded_key);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_256_enc)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_256_enc_ce);
	}
	return PROVIDER_BASIC(XTS_AES_256_enc);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_256_dec)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_256_dec_ce);
	}
	return PROVIDER_BASIC(XTS_AES_256_dec);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_256_enc_expanded_key)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_256_enc_expanded_key_ce);
	}
	return PROVIDER_BASIC(XTS_AES_256_enc_expanded_key);
}

DEFINE_INTERFACE_DISPATCHER(XTS_AES_256_dec_expanded_key)
{
	if (is_crypto_available()) {
		return PROVIDER_INFO(XTS_AES_256_dec_expanded_key_ce);
	}
	return PROVIDER_BASIC(XTS_AES_256_dec_expanded_key);
}
