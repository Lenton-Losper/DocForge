"""Ollama Service for AI-powered features."""
import httpx
import json
from typing import Optional, List, Dict, Any
import os
import traceback

class OllamaService:
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'llama3.2')
        self.timeout = 60.0  # 60 seconds
        print("=" * 80)
        print(f"[OllamaService] [OK] Initialized with URL: {self.base_url}, Model: {self.model}")
        print("=" * 80)
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate text using Ollama"""
        try:
            print(f"[Ollama] Generating with prompt length: {len(prompt)} chars")
            if system_prompt:
                print(f"[Ollama] System prompt length: {len(system_prompt)} chars")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    'model': self.model,
                    'prompt': prompt,
                    'stream': False,
                    'options': {
                        'temperature': 0.7,
                        'top_p': 0.9,
                        'top_k': 40
                    }
                }
                
                if system_prompt:
                    payload['system'] = system_prompt
                
                print(f"[Ollama] Sending request to: {self.base_url}/api/generate")
                print(f"[Ollama] Model: {self.model}, Stream: False")
                
                response = await client.post(
                    f'{self.base_url}/api/generate',
                    json=payload
                )
                
                print(f"[Ollama] Response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text[:500]  # Limit error text length
                    print(f"[Ollama] [ERROR] Error response: {error_text}")
                    raise Exception(f'Ollama returned status {response.status_code}: {error_text}')
                
                data = response.json()
                result = data.get('response', '').strip()
                
                if not result:
                    print(f"[Ollama] [ERROR] Empty response from Ollama. Full data: {data}")
                    raise Exception('Ollama returned empty response')
                
                print(f"[Ollama] [OK] Generation complete. Response length: {len(result)} chars")
                return result
                
        except httpx.TimeoutException as e:
            print(f"[Ollama] [ERROR] Timeout error: {e}")
            traceback.print_exc()
            raise Exception('Ollama request timed out. The model may be loading or too slow.')
        except httpx.ConnectError as e:
            print(f"[Ollama] [ERROR] Connection error: {e}")
            traceback.print_exc()
            raise Exception(f'Cannot connect to Ollama at {self.base_url}. Make sure Ollama is running.')
        except Exception as e:
            print(f"[Ollama] [ERROR] Generation error: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            raise Exception(f'Failed to generate content: {str(e)}')
    
    async def improve_readme(self, readme: str, project_info: Dict[str, Any]) -> str:
        """Improve README content with AI"""
        print("=" * 80)
        print("[Ollama] improve_readme called")
        print(f"[Ollama] README length: {len(readme)} chars")
        print(f"[Ollama] Project info: {json.dumps(project_info, indent=2)}")
        
        system_prompt = """You are a senior technical documentation expert. Improve README files by:
- Adding clear, concise descriptions
- Organizing content logically
- Adding proper sections (Features, Installation, Usage, etc.)
- Improving formatting and readability
- Using professional, friendly tone

Output ONLY the improved README in markdown format. Do not add explanations or meta-commentary."""

        languages = ', '.join(project_info.get('languages', ['Unknown']))
        prompt = f"""Improve this README for a {languages} project:

Project Name: {project_info.get('name', 'Unknown')}
Current README:
{readme or 'No README found'}

Additional Context:
- Dependencies: {project_info.get('dependencies', 'Unknown')}
- Main Directories: {', '.join(project_info.get('directories', []))}
- Version: {project_info.get('version', 'Unknown')}

Generate an improved README with these sections:
1. Project title and brief description
2. Features (based on directory structure)
3. Prerequisites
4. Installation
5. Usage
6. Project Structure
7. Contributing (if appropriate)
8. License

Make it professional, clear, and actionable."""

        try:
            result = await self.generate(prompt, system_prompt)
            print(f"[Ollama] [OK] improve_readme completed. Result length: {len(result)} chars")
            print("=" * 80)
            return result
        except Exception as e:
            print(f"[Ollama] [ERROR] improve_readme failed: {e}")
            traceback.print_exc()
            print("=" * 80)
            raise
    
    async def generate_project_description(self, project_info: Dict[str, Any]) -> str:
        """Generate a concise project description"""
        system_prompt = """You are a technical writer. Create concise project descriptions (2-3 sentences).
Focus on what the project does, who it's for, and key technologies. Be specific and avoid generic phrases.
Output ONLY the description, nothing else."""

        prompt = f"""Create a project description for:

Name: {project_info.get('name', 'Unknown')}
Languages: {', '.join(project_info.get('languages', []))}
Dependencies: {project_info.get('dependencies', 'Unknown')}
Directories: {', '.join(project_info.get('directories', []))}
Version: {project_info.get('version', 'Unknown')}"""

        return await self.generate(prompt, system_prompt)
    
    async def generate_setup_guide(self, project_info: Dict[str, Any]) -> str:
        """Generate setup/installation guide"""
        system_prompt = """You are a technical documentation expert. Create clear, step-by-step installation and setup guides.
Include prerequisites, installation steps, configuration, and verification. Output ONLY the guide in markdown format."""

        prompt = f"""Create a setup guide for:

- Name: {project_info.get('name', 'Project')}
- Languages: {', '.join(project_info.get('languages', []))}
- Package Manager: {project_info.get('packageManager', 'npm')}
- Dependencies: {project_info.get('dependencies', 0)}
- Has Docker: {project_info.get('hasDocker', False)}
- Has Tests: {project_info.get('hasTests', False)}

Provide a complete installation and setup guide."""

        return await self.generate(prompt, system_prompt)
    
    async def generate_api_docs(self, endpoints: List[Dict[str, Any]]) -> str:
        """Generate API documentation"""
        system_prompt = """You are an API documentation expert. Create comprehensive API documentation with endpoint descriptions, request/response formats, examples, and error codes. Output ONLY the documentation in markdown format."""

        endpoints_text = '\n'.join([
            f"{i+1}. {ep.get('method', 'GET')} {ep.get('path', 'Unknown')}: {ep.get('description', 'No description')}"
            for i, ep in enumerate(endpoints)
        ])

        prompt = f"""Generate API documentation for these endpoints:

{endpoints_text}

Create comprehensive documentation with:
- Endpoint descriptions
- Request/response formats
- Code examples
- Error handling"""

        return await self.generate(prompt, system_prompt)
    
    async def generate_mermaid_diagram(self, diagram_type: str, data: Dict[str, Any]) -> str:
        """Generate Mermaid diagram code"""
        print("=" * 80)
        print(f"[Ollama] generate_mermaid_diagram called with type: {diagram_type}")
        print(f"[Ollama] Data: {json.dumps(data, indent=2)}")
        
        system_prompt = """You are a diagramming expert. Generate valid Mermaid diagram syntax.
Output ONLY the Mermaid code, no markdown code blocks, no explanations. The output must be valid Mermaid syntax that can be directly rendered."""

        prompts = {
            'architecture': f"""Generate a Mermaid flowchart diagram (flowchart TB) showing the architecture:

Components: {', '.join(data.get('components', []))}
Connections: {json.dumps(data.get('connections', []), indent=2)}

Create a flowchart diagram showing the system architecture.""",
            
            'dependency': f"""Generate a Mermaid graph diagram showing dependencies:

Dependencies: {json.dumps(data.get('dependencies', []), indent=2)}

Create a dependency graph.""",
            
            'flow': f"""Generate a Mermaid flowchart showing the flow:

Steps: {' -> '.join(data.get('steps', []))}

Create a flowchart."""
        }

        prompt = prompts.get(diagram_type, prompts['architecture'])
        
        try:
            result = await self.generate(prompt, system_prompt)
            # Remove markdown code blocks if present
            cleaned = result.replace('```mermaid\n', '').replace('```\n', '').replace('```', '').strip()
            print(f"[Ollama] [OK] generate_mermaid_diagram completed. Result length: {len(cleaned)} chars")
            print("=" * 80)
            return cleaned
        except Exception as e:
            print(f"[Ollama] [ERROR] generate_mermaid_diagram failed: {e}")
            traceback.print_exc()
            print("=" * 80)
            raise
    
    async def analyze_code_quality(self, code_structure: Dict[str, Any]) -> List[str]:
        """Analyze code quality and return suggestions"""
        system_prompt = """You are a code quality expert. Analyze code structure and provide actionable suggestions for improvement. Output ONLY a numbered list of suggestions, one per line. Be specific and practical."""

        prompt = f"""Analyze this code structure:

- Files: {code_structure.get('files', 0)}
- Languages: {', '.join(code_structure.get('languages', []))}
- Has Tests: {code_structure.get('hasTests', False)}
- Has Linting: {code_structure.get('hasLinting', False)}
- Has CI/CD: {code_structure.get('hasCI', False)}
- Dependencies: {code_structure.get('dependencies', 0)}
- Structure: {code_structure.get('structure', 'Unknown')}

Provide 5-10 specific, actionable suggestions for improving code quality."""

        result = await self.generate(prompt, system_prompt)
        # Parse numbered list into array
        import re
        suggestions = []
        for line in result.split('\n'):
            line = line.strip()
            # Match numbered items (1., 2), etc.)
            match = re.match(r'^\d+[\.\)]\s*(.+)', line)
            if match:
                suggestions.append(match.group(1).strip())
        return [s for s in suggestions if len(s) > 0]
    
    async def health_check(self) -> bool:
        """Check if Ollama is running"""
        try:
            print(f"[Ollama] Health check: Checking {self.base_url}/api/tags")
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f'{self.base_url}/api/tags')
                is_healthy = response.status_code == 200
                status_msg = '[OK] Healthy' if is_healthy else f'[ERROR] Unhealthy (status: {response.status_code})'
                print(f"[Ollama] Health check: {status_msg}")
                return is_healthy
        except Exception as e:
            print(f"[Ollama] [ERROR] Health check failed: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            return False
    
    async def list_models(self) -> List[str]:
        """List available Ollama models"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f'{self.base_url}/api/tags')
                if response.status_code == 200:
                    data = response.json()
                    return [model['name'] for model in data.get('models', [])]
                return []
        except:
            return []

# Singleton instance
ollama_service = OllamaService()
print("[OllamaService] [OK] Singleton instance created")