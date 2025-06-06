#!/usr/bin/env python3
# This script needs to run with virtual environment activated
# -*- coding: utf-8 -*-
"""
CLIP-based AI Content Detection System
AI üretimi içerik tespiti için CLIP modeli kullanımı
"""

import torch
import clip
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import json
import sys
import base64
import argparse
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings("ignore")

class CLIPAIDetector:
    def __init__(self, device: str = "auto"):
        """CLIP AI Detection sistemi başlatıcı"""
        # Device selection
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device
            
        print(f"🚀 CLIP AI Detector başlatılıyor... (Device: {self.device})")
        
        # Load CLIP model
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        self.model.eval()
        
        # AI detection prompts - Türkçe ve İngilizce
        self.ai_prompts = [
            # AI Generation Indicators
            "artificial intelligence generated image",
            "computer generated artwork", 
            "digital art created by AI",
            "synthetic image from neural network",
            "AI-generated digital illustration",
            "machine learning created picture",
            "artificial neural network output",
            "computer vision generated content",
            "yapay zeka tarafından üretilmiş görsel",
            "bilgisayar tarafından oluşturulan sanat",
            "dijital AI sanatı",
            "sinir ağı çıktısı",
            
            # Specific AI Art Styles
            "surreal digital art style typical of AI",
            "highly detailed fantasy art by AI",
            "photorealistic AI rendering",
            "abstract digital art by neural network",
            "hyperrealistic AI-generated portrait",
            "fantastical landscape by artificial intelligence",
            
            # Technical AI Indicators
            "perfect lighting and composition typical of AI",
            "unnaturally smooth textures from AI generation",
            "impossible physics in AI-generated scene",
            "too perfect symmetry from neural network",
            "artificial color palette typical of AI models",
            "digital artifacts from AI generation process"
        ]
        
        # Human/Natural prompts
        self.natural_prompts = [
            # Natural Photography
            "authentic photograph taken by human photographer",
            "real world captured with camera",
            "natural lighting in genuine photograph", 
            "spontaneous moment captured in real life",
            "documentary style photograph",
            "candid human photography",
            "genuine real-world scene",
            "unposed natural photograph",
            "gerçek fotoğraf insan tarafından çekilmiş",
            "doğal anın yakalandığı fotoğraf",
            "gerçek dünya görüntüsü",
            "orijinal fotoğraf",
            
            # Human Art Characteristics  
            "hand-drawn illustration by human artist",
            "traditional painting technique",
            "human creativity and artistic expression",
            "imperfect but authentic artistic work",
            "personal artistic style of human creator",
            "emotional depth in human artwork"
        ]
        
        # Text analysis prompts
        self.ai_text_prompts = [
            "artificially generated text by language model",
            "computer-written content with perfect grammar",
            "AI-generated response with formal structure", 
            "machine learning text output",
            "robotic writing style typical of AI",
            "perfectly structured AI-generated content",
            "yapay zeka tarafından üretilmiş metin",
            "bilgisayar tarafından yazılmış içerik",
            "AI dil modeli çıktısı"
        ]
        
        self.human_text_prompts = [
            "naturally written text by human author",
            "personal writing style with human imperfections",
            "authentic human communication",
            "spontaneous human expression",
            "emotional human writing",
            "personal experience shared by human",
            "insan tarafından yazılmış doğal metin",
            "kişisel yazım stili",
            "otantik insan iletişimi"
        ]
        
        print("✅ CLIP AI Detector hazır!")
        
    def encode_prompts(self, prompts: List[str]) -> torch.Tensor:
        """Text prompt'larını encode et"""
        text_tokens = clip.tokenize(prompts).to(self.device)
        with torch.no_grad():
            text_features = self.model.encode_text(text_tokens)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        return text_features
    
    def analyze_image(self, image_data: bytes) -> Dict:
        """Görsel analizi CLIP ile"""
        try:
            # Image loading
            image = Image.open(BytesIO(image_data)).convert('RGB')
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)
            
            # Image encoding
            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            # AI prompts encoding
            ai_features = self.encode_prompts(self.ai_prompts)
            natural_features = self.encode_prompts(self.natural_prompts)
            
            # Similarity calculations
            ai_similarities = (image_features @ ai_features.T).cpu().numpy()[0]
            natural_similarities = (image_features @ natural_features.T).cpu().numpy()[0]
            
            # Scoring
            ai_score = float(np.mean(ai_similarities))
            natural_score = float(np.mean(natural_similarities))
            max_ai_sim = float(np.max(ai_similarities))
            max_natural_sim = float(np.max(natural_similarities))
            
            # Best matching prompts
            best_ai_idx = np.argmax(ai_similarities)
            best_natural_idx = np.argmax(natural_similarities)
            
            # Detection logic
            confidence_diff = max_ai_sim - max_natural_sim
            
            if confidence_diff > 0.05:  # AI eğilimi
                prediction = "ai-generated"
                confidence = min(85, 50 + (confidence_diff * 200))
            elif confidence_diff < -0.05:  # Natural eğilimi  
                prediction = "human-generated"
                confidence = min(85, 50 + (abs(confidence_diff) * 200))
            else:
                prediction = "uncertain"
                confidence = 30 + (abs(confidence_diff) * 100)
            
            return {
                "prediction": prediction,
                "confidence": confidence,
                "ai_score": ai_score,
                "natural_score": natural_score,
                "max_ai_similarity": max_ai_sim,
                "max_natural_similarity": max_natural_sim,
                "best_ai_match": self.ai_prompts[best_ai_idx],
                "best_natural_match": self.natural_prompts[best_natural_idx],
                "confidence_difference": confidence_diff,
                "method": "CLIP-ViT-B/32",
                "explanation": self._generate_explanation(prediction, confidence, confidence_diff, 
                                                        self.ai_prompts[best_ai_idx], 
                                                        self.natural_prompts[best_natural_idx])
            }
            
        except Exception as e:
            return {
                "error": f"Image analysis error: {str(e)}",
                "prediction": "error",
                "confidence": 0
            }
    
    def analyze_text(self, text: str) -> Dict:
        """Metin analizi CLIP ile"""
        try:
            # Create image-like representation of text for CLIP
            # This is a workaround since CLIP is primarily for images
            # We'll use text-to-text similarity
            
            text_input = clip.tokenize([text], truncate=True).to(self.device)
            
            with torch.no_grad():
                text_features = self.model.encode_text(text_input)
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            # AI text prompts
            ai_text_features = self.encode_prompts(self.ai_text_prompts)
            human_text_features = self.encode_prompts(self.human_text_prompts)
            
            # Similarities
            ai_similarities = (text_features @ ai_text_features.T).cpu().numpy()[0]
            human_similarities = (text_features @ human_text_features.T).cpu().numpy()[0]
            
            ai_score = float(np.mean(ai_similarities))
            human_score = float(np.mean(human_similarities))
            max_ai_sim = float(np.max(ai_similarities))
            max_human_sim = float(np.max(human_similarities))
            
            # Best matches
            best_ai_idx = np.argmax(ai_similarities)
            best_human_idx = np.argmax(human_similarities)
            
            confidence_diff = max_ai_sim - max_human_sim
            
            if confidence_diff > 0.03:
                prediction = "ai-generated"
                confidence = min(80, 45 + (confidence_diff * 300))
            elif confidence_diff < -0.03:
                prediction = "human-generated"  
                confidence = min(80, 45 + (abs(confidence_diff) * 300))
            else:
                prediction = "uncertain"
                confidence = 25 + (abs(confidence_diff) * 150)
            
            return {
                "prediction": prediction,
                "confidence": confidence,
                "ai_score": ai_score,
                "human_score": human_score,
                "max_ai_similarity": max_ai_sim,
                "max_human_similarity": max_human_sim,
                "best_ai_match": self.ai_text_prompts[best_ai_idx],
                "best_human_match": self.human_text_prompts[best_human_idx],
                "confidence_difference": confidence_diff,
                "method": "CLIP-Text-Analysis",
                "explanation": self._generate_text_explanation(prediction, confidence, confidence_diff)
            }
            
        except Exception as e:
            return {
                "error": f"Text analysis error: {str(e)}",
                "prediction": "error", 
                "confidence": 0
            }
    
    def _generate_explanation(self, prediction: str, confidence: float, diff: float, 
                            ai_match: str, natural_match: str) -> str:
        """Görsel analizi için açıklama oluştur"""
        
        if prediction == "ai-generated":
            return f"🤖 CLIP AI Detection: Görsel yapay zeka üretimi olarak tespit edildi. " \
                   f"En yüksek benzerlik AI pattern'i ile: '{ai_match}'. " \
                   f"Güven farkı: {diff:.3f}"
        elif prediction == "human-generated":
            return f"👨‍🎨 CLIP AI Detection: Görsel insan üretimi olarak tespit edildi. " \
                   f"En yüksek benzerlik doğal pattern ile: '{natural_match}'. " \
                   f"Güven farkı: {abs(diff):.3f}"
        else:
            return f"🤔 CLIP AI Detection: Belirsiz sonuç. Hem AI hem de doğal pattern'lere benzerlik gösteriyor. " \
                   f"Güven farkı çok düşük: {abs(diff):.3f}"
    
    def _generate_text_explanation(self, prediction: str, confidence: float, diff: float) -> str:
        """Metin analizi için açıklama oluştur"""
        
        if prediction == "ai-generated":
            return f"🤖 CLIP Text Analysis: Metin yapay zeka üretimi pattern'leri gösteriyor. " \
                   f"AI yazım stili benzerliği yüksek. Güven farkı: {diff:.3f}"
        elif prediction == "human-generated":
            return f"✍️ CLIP Text Analysis: Metin insan yazım pattern'leri gösteriyor. " \
                   f"Doğal yazım stili tespit edildi. Güven farkı: {abs(diff):.3f}"
        else:
            return f"🤔 CLIP Text Analysis: Metin hem AI hem de insan pattern'lerine benzerlik gösteriyor. " \
                   f"Belirsiz sonuç. Güven farkı: {abs(diff):.3f}"

def main():
    """CLI interface"""
    parser = argparse.ArgumentParser(description='CLIP AI Content Detector')
    parser.add_argument('--type', choices=['image', 'text'], required=True, help='Content type to analyze')
    parser.add_argument('--input', required=True, help='Input file path or text content')
    parser.add_argument('--base64', action='store_true', help='Input is base64 encoded')
    parser.add_argument('--device', default='auto', help='Device to use (cuda/cpu/auto)')
    
    args = parser.parse_args()
    
    # Initialize detector
    detector = CLIPAIDetector(device=args.device)
    
    try:
        if args.type == 'image':
            if args.base64:
                # Base64 input from web interface
                image_data = base64.b64decode(args.input)
            else:
                # File path input
                with open(args.input, 'rb') as f:
                    image_data = f.read()
            
            result = detector.analyze_image(image_data)
            
        elif args.type == 'text':
            text_content = args.input
            result = detector.analyze_text(text_content)
        
        # Output JSON result
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "prediction": "error",
            "confidence": 0
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main() 