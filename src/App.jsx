import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ContentCopy,
  CheckCircle,
  FormatAlignLeft,
  FormatAlignRight,
  Clear,
  ContentPaste,
  ExpandMore,
  Calculate
} from '@mui/icons-material';

const App = () => {
  // États pour l'IBAN principal
  const [iban, setIban] = useState('');
  const [cleIban, setCleIban] = useState('');
  const [ibanValide, setIbanValide] = useState(null);
  
  // États pour le RIB décodé
  const [codeBanque, setCodeBanque] = useState('');
  const [codeGuichet, setCodeGuichet] = useState('');
  const [noCompte, setNoCompte] = useState('');
  const [cleRib, setCleRib] = useState('');
  
  // États pour les messages
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showSpaces, setShowSpaces] = useState(true);
  
  // Analyser automatiquement l'IBAN quand il change
  useEffect(() => {
    if (iban) {
      const trimmedIban = iban.trim();
      if (trimmedIban.length > 4) {
        analyserIban(trimmedIban);
      }
    }
  }, [iban]);

  // Fonction pour extraire uniquement les nombres
  const litnombre = (chaineNombre) => {
    return chaineNombre.replace(/[^0-9]/g, '');
  };

  // Fonction pour traiter le numéro de compte (lettres converties en chiffres)
  const litnombreCompte = (chaineNombre) => {
    let chaine = chaineNombre.toUpperCase();
    let resultat = '';
    
    for (let i = 0; i < chaine.length; i++) {
      let char = chaine.charCodeAt(i);
      
      if (char >= 48 && char <= 57) {
        // Chiffre
        resultat += chaine[i];
      } else if (char >= 65 && char <= 90) {
        // Lettre A-Z
        let nb = char - 64;
        if (nb > 9) nb = nb - 9;
        if (nb > 9) nb = nb - 8;
        resultat += nb;
      }
    }
    
    return resultat;
  };

  // Fonction pour traiter les lettres IBAN
  const litnombreIBAN = (chaineNombre) => {
    let chaine = chaineNombre;
    let resultat = '';
    
    for (let i = 0; i < chaine.length; i++) {
      let char = chaine.charCodeAt(i);
      
      if (char >= 48 && char <= 57) {
        // Chiffre
        resultat += chaine[i];
      } else if (char >= 65 && char <= 90) {
        // Lettre A-Z, A=10, Z=35
        let nb = char - 55;
        resultat += nb;
      } else if (char >= 97 && char <= 122) {
        // Lettre a-z, a=10, z=35
        let nb = char - 87;
        resultat += nb;
      }
      // Ignore les autres caractères
    }
    
    return resultat;
  };

  // Fonction pour retirer les espaces
  const fRetireSpace = (chaine) => {
    let resultat = '';
    
    for (let i = 0; i < chaine.length; i++) {
      const char = chaine.charCodeAt(i);
      
      if (char >= 48 && char <= 57) {
        // Chiffre
        resultat += chaine[i];
      } else if (char >= 65 && char <= 90) {
        // Lettre majuscule
        resultat += chaine[i];
      } else if (char >= 97 && char <= 122) {
        // Lettre minuscule -> majuscule
        resultat += chaine[i].toUpperCase();
      }
      // Ignore les espaces et autres caractères
    }
    
    return resultat;
  };

  // Fonction pour formater l'IBAN avec des espaces
  const formatIban = (chaine) => {
    const clean = fRetireSpace(chaine);
    let resultat = '';
    
    for (let i = 0; i < clean.length; i++) {
      if (i % 4 === 0 && i > 0) {
        resultat += ' ';
      }
      resultat += clean[i];
    }
    
    return resultat;
  };

  // Fonction principale pour analyser l'IBAN
  const analyserIban = (inputIban) => {
    const ibanClean = fRetireSpace(inputIban);
    if (ibanClean.length < 4) return;
    
    // Extraire la clé IBAN
    setCleIban(ibanClean.substring(2, 4));
    
    // Vérifier la validité
    const paysCode = ibanClean.substring(0, 2);
    const cleActuelle = ibanClean.substring(2, 4);
    const ribPart = ibanClean.substring(4);

    // Vérification du format du code pays
    if (paysCode.charCodeAt(0) < 65 || paysCode.charCodeAt(0) > 90 ||
        paysCode.charCodeAt(1) < 65 || paysCode.charCodeAt(1) > 90) {
      setIbanValide(false);
      setMessage('Le code pays doit avoir 2 lettres (de A à Z)');
      setMessageType('error');
      return;
    }

    // Calcul de la clé attendue
    const concat = litnombreIBAN(ribPart + paysCode + '00');
    
    let retenue = '';
    let i = 0;
    
    while (i < concat.length) {
      const bloc = retenue + concat.substring(i, i + 9);
      const nbBloc = parseFloat(bloc);
      const modulo = nbBloc % 97;
      retenue = String(modulo);
      i += 9;
    }

    const cleCalculee = 98 - (parseFloat(retenue) % 97);
    const cleStr = cleCalculee < 10 ? '0' + cleCalculee : String(cleCalculee);

    if (cleStr !== cleActuelle) {
      setIbanValide(false);
      setMessage(`La clé IBAN (${cleActuelle}) est incorrecte (valeur calculée: ${cleStr})`);
      setMessageType('error');
      return;
    }

    // L'IBAN est valide
    setIbanValide(true);
    
    // Décoder automatiquement si c'est un IBAN français
    if (paysCode === 'FR') {
      if (ribPart.length === 23) {
        setCodeBanque(ribPart.substring(0, 5));
        setCodeGuichet(ribPart.substring(5, 10));
        setNoCompte(ribPart.substring(10, 21));
        setCleRib(ribPart.substring(21, 23));
        
        // Vérifier la clé RIB
        const codeBanqueExtrait = litnombre(ribPart.substring(0, 5));
        const codeGuichetExtrait = litnombre(ribPart.substring(5, 10));
        const noCompteExtrait = litnombreCompte(ribPart.substring(10, 21));
        const cleRibExtrait = ribPart.substring(21, 23);

        // Calculer la clé RIB attendue
        const a = parseFloat(codeBanqueExtrait);
        const b = parseFloat(codeGuichetExtrait);
        const c = parseFloat(noCompteExtrait);

        const d = 8 * a;
        const resA = d % 97;

        const e = 15 * b;
        const resB = 97 - (e % 97);

        const f = 3 * c;
        const resC = 97 - (f % 97);

        const g = resA + resB + resC;
        let cleRibCalculee = g % 97;

        if (cleRibCalculee === 0) {
          cleRibCalculee = 97;
        }

        const cleRibStr = cleRibCalculee < 10 ? '0' + cleRibCalculee : String(cleRibCalculee);

        if (cleRibStr !== cleRibExtrait) {
          setMessage('IBAN valide - mais la clé RIB française est incorrecte');
          setMessageType('warning');
        } else {
          setMessage('IBAN valide et RIB français décodé avec succès');
          setMessageType('success');
        }
      } else {
        setMessage('IBAN valide - mais le RIB français doit avoir 23 caractères');
        setMessageType('warning');
      }
    } else {
      setMessage(`IBAN valide (Pays: ${paysCode})`);
      setMessageType('success');
    }
  };

  // Fonction pour coller depuis le presse-papiers
  const collerDepuisPressePapiers = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setIban(formatIban(text));
    } catch (error) {
      // Utilisation de la variable error ou on peut simplement l'omettre
      console.error('Erreur de lecture du presse-papiers:', error);
      setMessage('Impossible de lire le presse-papiers');
      setMessageType('error');
    }
  };

  // Fonction pour basculer le format de l'IBAN
  const toggleIbanFormat = () => {
    if (showSpaces) {
      setIban(fRetireSpace(iban));
    } else {
      setIban(formatIban(iban));
    }
    setShowSpaces(!showSpaces);
  };

  // Fonction pour copier dans le presse-papiers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Fonction pour copier le RIB pour tableur
  const copyRibToSpreadsheet = () => {
    // Format: Code banque [TAB] Code guichet [TAB] Numéro de compte [TAB] Clé RIB
    const formattedText = `${codeBanque}\t${codeGuichet}\t${noCompte}\t${cleRib}`;
    
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        setMessage('Données RIB copiées pour tableur');
        setMessageType('success');
        
        // Effacer le message après 3 secondes
        setTimeout(() => {
          if (message === 'Données RIB copiées pour tableur') {
            setMessage('');
          }
        }, 3000);
      })
      .catch(error => {
        console.error('Erreur lors de la copie:', error);
        setMessage('Impossible de copier dans le presse-papiers');
        setMessageType('error');
      });
  };

  // Fonction pour réinitialiser
  const reinitialiser = () => {
    setIban('');
    setCleIban('');
    setIbanValide(null);
    setCodeBanque('');
    setCodeGuichet('');
    setNoCompte('');
    setCleRib('');
    setMessage('');
  };

  // Fonction pour calculer la clé RIB
  const calculerCleRib = () => {
    const codeB = litnombre(codeBanque);
    const codeG = litnombre(codeGuichet);
    
    // On garde la version originale du numéro de compte (avec les lettres)
    const noCompteOriginal = noCompte;
    
    // On convertit seulement pour le calcul de la clé
    const noC = litnombreCompte(noCompte);

    if (codeB.length !== 5 || codeG.length !== 5 || noC.length > 11) {
      setMessage('Vérifiez le format des champs RIB');
      setMessageType('error');
      return;
    }

    // Calcul de la clé RIB (inchangé)
    const a = parseFloat(codeB);
    const b = parseFloat(codeG);
    const c = parseFloat(noC);

    const d = 8 * a;
    const resA = d % 97;

    const e = 15 * b;
    const resB = 97 - (e % 97);

    const f = 3 * c;
    const resC = 97 - (f % 97);

    const g = resA + resB + resC;
    let i = g % 97;

    if (i === 0) {
      i = 97;
    }

    const result = i < 10 ? '0' + i : String(i);
    setCleRib(result);
    
    // Générer l'IBAN (MODIFIÉ pour conserver les lettres)
    // On complète le numéro de compte original avec des zéros si nécessaire
    const noCompteComplete = noCompteOriginal.padEnd(11, '0');
    
    // On utilise le numéro de compte original avec les lettres
    const ribComplet = `${codeBanque}${codeGuichet}${noCompteComplete}${result}`;
    const codePays = 'FR';
    
    // Pour le reste du calcul de l'IBAN, on convertit en nombres (inchangé)
    const concat = litnombreIBAN(ribComplet + codePays + '00');
    
    let retenue = '';
    let j = 0;
    
    while (j < concat.length) {
      const bloc = retenue + concat.substring(j, j + 9);
      const nbBloc = parseFloat(bloc);
      const modulo = nbBloc % 97;
      retenue = String(modulo);
      j += 9;
    }

    const cleNum = 98 - (parseFloat(retenue) % 97);
    const cleStr = cleNum < 10 ? '0' + cleNum : String(cleNum);
    
    setCleIban(cleStr);
    const ibanCalcule = codePays + cleStr + ribComplet;
    setIban(formatIban(ibanCalcule));
    setIbanValide(true);
    setMessage('Clé RIB et IBAN calculés avec succès');
    setMessageType('success');
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Convertir un IBAN en RIB
        </Typography>
        <Typography variant="body1" paragraph align="center" color="textSecondary">
          Collez votre IBAN pour le vérifier et le convertir automatiquement
        </Typography>
      </Paper>

      {message && (
        <Alert 
          severity={messageType} 
          onClose={() => setMessage('')} 
          sx={{ mb: 4 }}
        >
          {message}
        </Alert>
      )}

      {/* Section principale - Vérification IBAN */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            Vérifier un IBAN
          </Typography>
          
          <TextField
            fullWidth
            label="IBAN"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="Collez votre IBAN ici (ex: FR76 1234 5678 9012 3456 7890 123)"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={collerDepuisPressePapiers} size="small" title="Coller">
                    <ContentPaste />
                  </IconButton>
                  <IconButton onClick={() => copyToClipboard(iban)} size="small" title="Copier">
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {ibanValide !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color={ibanValide ? 'success' : 'error'} />
                <Typography color={ibanValide ? 'success.main' : 'error.main'}>
                  {ibanValide ? 'IBAN valide' : 'IBAN invalide'}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="outlined"
              onClick={toggleIbanFormat}
              startIcon={showSpaces ? <FormatAlignLeft /> : <FormatAlignRight />}
            >
              {showSpaces ? 'Retirer' : 'Ajouter'} espaces
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={reinitialiser}
              startIcon={<Clear />}
            >
              Effacer
            </Button>
          </Box>

          {cleIban && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Clé IBAN: <strong>{cleIban}</strong>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Section RIB décodé (apparaît seulement si IBAN FR valide) */}
      {ibanValide && codeBanque && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                RIB décodé
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={copyRibToSpreadsheet}
                size="small"
              >
                Copier pour tableur
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code banque"
                  value={codeBanque}
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => copyToClipboard(codeBanque)} size="small" title="Copier">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code guichet"
                  value={codeGuichet}
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => copyToClipboard(codeGuichet)} size="small" title="Copier">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Numéro de compte"
                  value={noCompte}
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => copyToClipboard(noCompte)} size="small" title="Copier">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Clé RIB"
                  value={cleRib}
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => copyToClipboard(cleRib)} size="small" title="Copier">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Section Calculateur RIB (accessible via Accordion) */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Calculateur RIB vers IBAN</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Calculez la clé RIB et générez l'IBAN à partir des composants
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code banque (5 chiffres)"
                value={codeBanque}
                onChange={(e) => setCodeBanque(e.target.value)}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code guichet (5 chiffres)"
                value={codeGuichet}
                onChange={(e) => setCodeGuichet(e.target.value)}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Numéro de compte (11 caractères)"
                value={noCompte}
                onChange={(e) => setNoCompte(e.target.value)}
                inputProps={{ maxLength: 11 }}
                helperText="Peut contenir des lettres"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Clé RIB"
                value={cleRib}
                onChange={(e) => setCleRib(e.target.value)}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Calculate />}
              onClick={calculerCleRib}
            >
              Calculer clé RIB et générer IBAN
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4, textAlign: 'center', color: 'textSecondary' }}>
        <Typography variant="caption">
          Tous les calculs sont effectués localement dans votre navigateur.
          Aucune donnée n'est envoyée à un serveur externe.
        </Typography>
      </Box>
    </Container>
  );
};

export default App;