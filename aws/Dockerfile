FROM public.ecr.aws/lambda/python:3.12  
  
ENV PIP_NO_CACHE_DIR=1 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1  
  
WORKDIR /var/task  
  
COPY requirements.txt /var/task/  
RUN pip install --no-cache-dir -r requirements.txt  
  
COPY pdf_extractor.py /var/task/  
COPY gemini_quiz.py   /var/task/  
#COPY quiz_gen.py   /var/task/  
  
# default for function #1; function #2 overrides handler in Lambda config  
CMD ["pdf_extractor.lambda_handler"] 
#CMD ["quiz_gen.lambda_handler"] 
